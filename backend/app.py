from fastapi import FastAPI, Form, Request , HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Dict, List
from contextlib import contextmanager
from fastapi.responses import JSONResponse, HTMLResponse
import queue
from fastapi.middleware.cors import CORSMiddleware
import threading
import asyncio
import paramiko
from datetime import datetime, time
import sqlite3
from fastapi import File, UploadFile, Form
import uuid
import json
from datetime import datetime, timedelta  # Specific datetime imports
import random  # For generating simulated data
import os
import uuid
import sqlite3
import paramiko
import requests
import xml.etree.ElementTree as ET
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import os
import base64
import requests
from typing import Dict, Optional, Any
from fastapi import HTTPException, Query
from pydantic import BaseModel, validator
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from fastapi import FastAPI, Path
from typing import Union
import time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.base import JobLookupError
import requests
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
jenkins_router = APIRouter()
scaling_router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DB_POOL_SIZE = 5
db_pool = queue.Queue(maxsize=DB_POOL_SIZE)


app = FastAPI()

# Initialize the connection pool
def init_db_pool():
    for _ in range(DB_POOL_SIZE):
        conn = sqlite3.connect('cluster_1.db', timeout=30.0)
        # Enable WAL mode for better concurrent access
        conn.execute('PRAGMA journal_mode=WAL')
        db_pool.put(conn)

# Context manager for database connections
@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = db_pool.get(timeout=5)
        yield conn
    finally:
        if conn:
            try:
                conn.rollback()  # Rollback any uncommitted changes
            except Exception:
                pass
            db_pool.put(conn)

global clusters
clusters = {}

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:5173",
        "http://localhost:3000",  # React default
        "http://127.0.0.1:3000",
        "*"  # This allows all origins; use cautiously in production
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
# Initialize the SQLite database
def init_db():
    conn = sqlite3.connect('cluster_1.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS clusters
                 (name TEXT PRIMARY KEY, ip TEXT, port INTEGER, username TEXT, password TEXT, interval INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS cluster_stats
                 (cluster_name TEXT, timestamp TEXT, node_name TEXT, cpu TEXT, cpu_percent TEXT, memory TEXT, memory_percent TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS pods
                 (cluster_name TEXT, pod_name TEXT PRIMARY KEY, image TEXT, node TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS pod_stats
                 (pod_name TEXT, timestamp TEXT, cpu_percent TEXT, memory_percent TEXT,
                  FOREIGN KEY(pod_name) REFERENCES pods(pod_name))''')
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin')))''') 
    conn.commit()
    conn.close()

init_db()

# Global variables for storing in-memory data
cluster_stats: Dict[str, List[Dict]] = {}
cluster_images: Dict[str, Dict[str, int]] = {}
cluster_pods: Dict[str, List[Dict]] = {}
clusters: Dict[str, Dict] = {}

class ClusterCredentials(BaseModel):
    name: str
    ip: str
    port: int
    username: str
    password: str
    interval: int

async def collect_cluster_stats(cluster_name: str, interval: int):
    while True:
        try:
            conn = sqlite3.connect('cluster_1.db')
            c = conn.cursor()
            c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
            cluster = c.fetchone()
            if not cluster:
                print(f"Cluster '{cluster_name}' not found in the database.")
                return
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])
            stdin, stdout, stderr = ssh.exec_command('kubectl top nodes')
            output = stdout.read().decode('utf-8')
            lines = output.strip().split('\n')[1:]
            stats = []
            for line in lines:
                parts = line.split()
                if len(parts) >= 5:
                    stats.append({
                        'name': parts[0],
                        'cpu': parts[1],
                        'cpu_percent': parts[2],
                        'memory': parts[3],
                        'memory_percent': parts[4]
                    })
            if cluster_name not in cluster_stats:
                cluster_stats[cluster_name] = []
            for stat in stats:
                c.execute("INSERT INTO cluster_stats (cluster_name, timestamp, node_name, cpu, cpu_percent, memory, memory_percent) VALUES (?, ?, ?, ?, ?, ?, ?)", (
                    cluster_name,
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    stat['name'],
                    stat['cpu'],
                    stat['cpu_percent'],
                    stat['memory'],
                    stat['memory_percent']
                ))
                cluster_stats[cluster_name].append({
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'stats': stat
                })
            stdin, stdout, stderr = ssh.exec_command('kubectl get pods --no-headers -o custom-columns=":metadata.name,:spec.containers[0].image,:spec.nodeName"')
            pods_output = stdout.read().decode('utf-8')
            pod_lines = pods_output.strip().split('\n')
            pods = []
            images = {}
            for line in pod_lines:
                parts = line.split()
                if len(parts) >= 3:
                    pod_name = parts[0]
                    image = parts[1]
                    node_name = parts[2]
                    pods.append({'name': pod_name, 'image': image, 'node': node_name})
                    if image in images:
                        images[image] += 1
                    else:
                        images[image] = 1
                    c.execute('''
                        INSERT OR IGNORE INTO pods (cluster_name, pod_name, image, node)
                        VALUES (?, ?, ?, ?)
                    ''', (cluster_name, pod_name, image, node_name))
            if cluster_name not in cluster_pods:
                cluster_pods[cluster_name] = []
            cluster_pods[cluster_name] = pods
            cluster_images[cluster_name] = images
            conn.commit()
            conn.close()
            ssh.close()
        except Exception as e:
            print(f"Error collecting stats for cluster {cluster_name}: {str(e)}")
        await asyncio.sleep(interval)

async def collect_pod_stats(cluster_name: str, interval: int):
    while True:
        try:
            conn = sqlite3.connect('cluster_1.db')
            c = conn.cursor()
            c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
            cluster = c.fetchone()
            if not cluster:
                print(f"Cluster '{cluster_name}' not found in the database.")
                return
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])
            stdin, stdout, stderr = ssh.exec_command('kubectl top pods --no-headers')
            pods_output = stdout.read().decode('utf-8')
            pod_lines = pods_output.strip().split('\n')
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            for line in pod_lines:
                parts = line.split()
                if len(parts) >= 3:
                    pod_name = parts[0]
                    cpu_percent = parts[1].rstrip('m')  # Remove 'm' from CPU
                    memory_percent = parts[2].rstrip('Mi')  # Remove 'Mi' from Memory
                    c.execute('''
                        INSERT INTO pod_stats (pod_name, timestamp, cpu_percent, memory_percent)
                        VALUES (?, ?, ?, ?)
                    ''', (pod_name, timestamp, cpu_percent, memory_percent))
            conn.commit()
            conn.close()
            ssh.close()
        except Exception as e:
            print(f"Error collecting pod stats for cluster {cluster_name}: {str(e)}")
        await asyncio.sleep(interval)

@app.post("/set_interval")
async def set_interval(cluster_name: str = Form(...), interval: int = Form(...)):
    if cluster_name not in clusters:
        return {"error": f"Cluster '{cluster_name}' not found"}
    clusters[cluster_name]['interval'] = interval
    for task in asyncio.all_tasks():
        if task.get_name() == f"collect_{cluster_name}" or task.get_name() == f"collect_pods_{cluster_name}":
            task.cancel()
    asyncio.create_task(collect_cluster_stats(cluster_name, interval)).set_name(f"collect_{cluster_name}")
    asyncio.create_task(collect_pod_stats(cluster_name, interval)).set_name(f"collect_pods_{cluster_name}")
    return {"message": f"Interval updated to {interval} seconds for cluster {cluster_name}"}

# Add superadmin credentials (configure these in production)
SUPERADMIN_USERNAME = "superadmin"
SUPERADMIN_PASSWORD = "admin123"

# Update User model and database initialization
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "admin"  # Default role is admin

class UserLogin(BaseModel):
    username: str
    password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

def init_db():
    conn = sqlite3.connect('cluster_1.db')
    c = conn.cursor()
   
    
    # Create superadmin if not exists
    c.execute("SELECT id FROM users WHERE username = ?", (SUPERADMIN_USERNAME,))
    if not c.fetchone():
        hashed_password = pwd_context.hash(SUPERADMIN_PASSWORD)
        c.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                  (SUPERADMIN_USERNAME, hashed_password, 'superadmin'))
    conn.commit()
    conn.close()
from fastapi.security import HTTPBasic, HTTPBasicCredentials
security = HTTPBasic()
# Add helper function for authentication
def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (credentials.username,))
        user = c.fetchone()
        
        if not user or not pwd_context.verify(credentials.password, user[2]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Basic"},
            )
        return {
            "id": user[0],
            "username": user[1],
            "role": user[3]
        }

# Updated endpoints
@app.post("/signup")
async def signup(user: UserCreate):
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            
            # Check if user exists
            c.execute("SELECT id FROM users WHERE username = ?", (user.username,))
            if c.fetchone():
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Username already exists"}
                )
            
            # Insert new user
            hashed_password = pwd_context.hash(user.password)
            c.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
                (user.username, hashed_password)
            )
            conn.commit()
            
            return {"message": "User created successfully"}

    except sqlite3.Error as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Database error: {str(e)}"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

@app.post("/login")
async def login(user: UserLogin):
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT password_hash, role FROM users WHERE username = ?", (user.username,))
        result = c.fetchone()
        
        if not result or not pwd_context.verify(user.password, result[0]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "message": "Login successful",
            "username": user.username,
            "role": result[1]
        }

# Admin management endpoints
@app.get("/api/admins")
async def get_admins(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT username, role FROM users")
        return [{"username": row[0], "role": row[1]} for row in c.fetchall()]

@app.delete("/api/admins/{username}")
async def delete_admin(username: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("DELETE FROM users WHERE username = ? AND role = 'admin'", (username,))
        conn.commit()
        if c.rowcount == 0:
            raise HTTPException(status_code=404, detail="Admin not found")
        return {"message": "Admin deleted successfully"}

@app.get("/list_clusters")
async def list_clusters():
    try:
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        
        cluster_list = []
        
        for cluster_name in clusters:
            # Get cluster credentials
            c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
            cluster_info = c.fetchone()
            
            if not cluster_info:
                continue


            # Create SSH connection
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(cluster_info[0], port=cluster_info[1], username=cluster_info[2], password=cluster_info[3])


            # Identify master node
            stdin, stdout, stderr = ssh.exec_command("kubectl get nodes -o wide")
            nodes_output = stdout.read().decode('utf-8')
            
            # Find master node (control-plane)
            master_node = None
            for line in nodes_output.split('\n')[1:]:
                if line and 'control-plane' in line:
                    master_node = line.split()[0]
                    break


            # If no master node found, use the first node
            if not master_node:
                master_node = nodes_output.split('\n')[1].split()[0] if len(nodes_output.split('\n')) > 1 else None


            # Get node stats
            cluster_details = {
                'cluster_name': cluster_name,
                'cpu': 0,
                'memory': 0,
                'nodes': 0,
                'pods': 0,
                'images': {},
                'status': 'Operational'
            }


            # Get total node count
            c.execute("""
                SELECT COUNT(DISTINCT node_name) as node_count
                FROM cluster_stats
                WHERE cluster_name = ?
            """, (cluster_name,))
            
            node_count = c.fetchone()[0] or 0
            cluster_details['nodes'] = node_count


            # Get master node metrics if available
            if master_node:
                c.execute("""
                    SELECT 
                        AVG(CAST(REPLACE(cpu_percent, '%', '') AS FLOAT)) as avg_cpu,
                        AVG(CAST(REPLACE(memory_percent, '%', '') AS FLOAT)) as avg_memory
                    FROM cluster_stats
                    WHERE cluster_name = ? AND node_name = ?
                """, (cluster_name, master_node))
                
                master_node_stats = c.fetchone()
                if master_node_stats:
                    cluster_details['cpu'] = round(master_node_stats[0] or 0, 2)
                    cluster_details['memory'] = round(master_node_stats[1] or 0, 2)


            # Get pod count and images
            c.execute("""
                SELECT image, COUNT(*) as image_count
                FROM pods
                WHERE cluster_name = ?
                GROUP BY image
            """, (cluster_name,))
            
            pod_images = c.fetchall()
            
            total_pods = 0
            images_dict = {}
            for image, count in pod_images:
                images_dict[image] = count
                total_pods += count
            
            cluster_details['pods'] = total_pods
            cluster_details['images'] = images_dict


            # Determine cluster status
            if total_pods == 0:
                cluster_details['status'] = 'Unavailable'
            elif cluster_details['cpu'] > 80 or cluster_details['memory'] > 80:
                cluster_details['status'] = 'Maintenance'


            cluster_list.append(cluster_details)


            # Close SSH connection
            ssh.close()
        
        conn.close()
        
        return {
            "clusters": cluster_list,
            "total_clusters": len(cluster_list)
        }
    
    except Exception as e:
        print(f"Error in list_clusters: {str(e)}")
        return {
            "error": f"Failed to retrieve cluster list: {str(e)}",
            "clusters": [],
            "total_clusters": 0
        }

@app.post("/delete_pod/{cluster_name}/{pod_name}")
async def delete_pod(cluster_name: str, pod_name: str):
    try:
        # Connect to the database to get cluster details
        conn = sqlite3.connect('cluster.db')
        cursor = conn.cursor()


        # Fetch cluster connection details
        cursor.execute("SELECT ip, username, password, port FROM clusters WHERE name = ?", (cluster_name,))
        cluster_details = cursor.fetchone()
        
        if not cluster_details:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        target_ip_master, username_master, password_master, port_master = cluster_details
        
        # Establish SSH connection to the master node
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(
            target_ip_master, 
            username=username_master, 
            password=password_master, 
            port=port_master
        )


        # Execute the kubectl delete command for the pod
        delete_command = f"kubectl delete pod {pod_name}"
        stdin, stdout, stderr = ssh.exec_command(delete_command)


        output = stdout.read().decode()
        error = stderr.read().decode()


        ssh.close()


        if error:
            raise HTTPException(status_code=400, detail=f"Error deleting pod: {error}")


        return {
            "message": f"Pod {pod_name} successfully deleted."
        }


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/delete_image")
async def delete_image(request: Request):
    try:
        data = await request.json()
        cluster_name = data['cluster_name']
        image = data['image']

        # Get cluster credentials
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        
        # Get cluster credentials
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()
        
        if not cluster:
            conn.close()
            return JSONResponse(content={"error": f"Cluster '{cluster_name}' not found"})

        # Get deployment name from image name
        deployment_name = image.split('/')[-1].split(':')[0]
        if deployment_name.startswith('deployment-'):
            deployment_name = deployment_name
        else:
            deployment_name = f"deployment-{deployment_name}"

        # Create SSH connection
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])

        # Delete deployment
        command = f"kubectl delete deployment {deployment_name}"
        stdin, stdout, stderr = ssh.exec_command(command)
        error = stderr.read().decode('utf-8')
        
        if error and 'not found' not in error.lower():  # Ignore "not found" errors
            ssh.close()
            conn.close()
            return JSONResponse(content={"error": error})

        # Delete from database
        try:
            c.execute("""
                DELETE FROM pods 
                WHERE cluster_name = ? AND image = ?
            """, (cluster_name, image))
            
            # Delete related pod stats
            c.execute("""
                DELETE FROM pod_stats 
                WHERE pod_name IN (
                    SELECT pod_name FROM pods 
                    WHERE cluster_name = ? AND image = ?
                )
            """, (cluster_name, image))
            
            conn.commit()

            # Get updated data for UI
            c.execute("SELECT pod_name, image, node FROM pods WHERE cluster_name = ?", (cluster_name,))
            pod_details = [{"name": pod[0], "image": pod[1], "node": pod[2]} for pod in c.fetchall()]
            
            c.execute("""
                SELECT image, COUNT(*) as count
                FROM pods
                WHERE cluster_name = ?
                GROUP BY image
            """, (cluster_name,))
            images = dict(c.fetchall())
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return JSONResponse(content={"error": f"Database error: {str(e)}"})
        finally:
            conn.close()
            ssh.close()

        return JSONResponse(content={
            "message": "Image deleted successfully",
            "updated_pods": pod_details,
            "updated_images": images
        })
        
    except Exception as e:
        print(f"Error in delete_image: {str(e)}")
        return JSONResponse(content={"error": str(e)})


# Modify the startup event
@app.on_event("startup")
async def startup_event():
    global clusters
    clusters = {}
    init_db()
    init_db_pool()  # Initialize the connection pool

    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute("SELECT name, ip, port, username, password, interval FROM clusters")
        rows = c.fetchall()
        for row in rows:
            cluster_name, ip, port, username, password, interval = row
            clusters[cluster_name] = {
                'name': cluster_name,
                'ip': ip,
                'port': port,
                'username': username,
                'password': password,
                'interval': interval
            }
            print(f"Added cluster: {cluster_name}")
            asyncio.create_task(collect_cluster_stats(cluster_name, interval)).set_name(f"collect_{cluster_name}")
            asyncio.create_task(collect_pod_stats(cluster_name, interval)).set_name(f"collect_pods_{cluster_name}")

# Add a cleanup event
@app.on_event("shutdown")
async def shutdown_event():
    while not db_pool.empty():
        conn = db_pool.get()
        conn.close()

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    cluster_count = len(clusters)
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "clusters": clusters,
        "cluster_count": cluster_count
    })

# @app.get("/get_cluster_metrics")
# async def get_cluster_metrics(cluster_name: str, node_name: str):
#     try:
#         conn = sqlite3.connect('cluster_1.db')
#         c = conn.cursor()

#         # Fetch the latest 100 metrics for the specified node and cluster
#         c.execute('''
#             SELECT timestamp, cpu_percent, memory_percent
#             FROM cluster_stats
#             WHERE cluster_name = ? AND node_name = ?
#             ORDER BY timestamp DESC
#             LIMIT 100
#         ''', (cluster_name, node_name))
        
#         rows = c.fetchall()
#         if not rows:
#             return {"error": "No data found for the specified node and cluster."}
        
#         # Reverse data for chronological order
#         timestamps = [row[0] for row in rows][::-1]
#         cpu_metrics = [row[1].replace('%', '') for row in rows][::-1]  # Stripping the '%' symbol
#         memory_metrics = [row[2].replace('%', '') for row in rows][::-1]  # Stripping the '%' symbol
        
#         conn.close()

#         return {
#             "timestamps": timestamps,
#             "cpu_metrics": cpu_metrics,
#             "memory_metrics": memory_metrics
#         }

#     except Exception as e:
#         return {"error": str(e)}
@app.get("/get_cluster_metrics")
async def get_cluster_metrics(
    cluster_name: str, 
    node_name: str, 
    time_range: str = Query(default='latest', enum=['latest', '1h', '6h', '12h', '24h', '7d'])
):
    try:
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()


        # Base query
        query = '''
            SELECT timestamp, cpu_percent, memory_percent
            FROM cluster_stats
            WHERE cluster_name = ? AND node_name = ?
        '''
        
        # Get current time
        current_time = datetime.now()


        # Determine sampling strategy
        if time_range == 'latest':
            # Last 30 minutes
            time_window = current_time - timedelta(minutes=30)
            query += ' AND timestamp >= ? ORDER BY timestamp DESC LIMIT 60'
            params = (cluster_name, node_name, time_window)
        
        elif time_range == '1h':
            # Last 60 minutes
            time_window = current_time - timedelta(hours=1)
            query += ' AND timestamp >= ? ORDER BY timestamp'
            params = (cluster_name, node_name, time_window)
        
        elif time_range == '6h':
            # Sample every 5 minutes for 6 hours
            time_window = current_time - timedelta(hours=6)
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM cluster_stats
                    WHERE cluster_name = ? AND node_name = ?
                    AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 5 = 0
                ORDER BY timestamp
            '''
            params = (cluster_name, node_name, time_window)
        
        elif time_range == '12h':
            # Sample every 10 minutes for 12 hours
            time_window = current_time - timedelta(hours=12)
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM cluster_stats
                    WHERE cluster_name = ? AND node_name = ?
                    AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 10 = 0
                ORDER BY timestamp
            '''
            params = (cluster_name, node_name, time_window)
        
        elif time_range == '24h':
            # Sample every 15 minutes for 24 hours
            time_window = current_time - timedelta(hours=24)
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM cluster_stats
                    WHERE cluster_name = ? AND node_name = ?
                    AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 15 = 0
                ORDER BY timestamp
            '''
            params = (cluster_name, node_name, time_window)
        
        elif time_range == '7d':
            # Sample every hour for 7 days
            time_window = current_time - timedelta(days=7)
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM cluster_stats
                    WHERE cluster_name = ? AND node_name = ?
                    AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 60 = 0
                ORDER BY timestamp
            '''
            params = (cluster_name, node_name, time_window)


        # Execute the query
        c.execute(query, params)
        rows = c.fetchall()


        # Process results
        if not rows:
            return {
                "timestamps": [],
                "cpu_metrics": [],
                "memory_metrics": [],
                "error": "No data found for the specified time range."
            }


        # Extract and process data
        timestamps = []
        cpu_metrics = []
        memory_metrics = []


        for row in rows:
            timestamps.append(row[0])
            cpu_metrics.append(row[1].replace('%', '') if isinstance(row[1], str) else row[1])
            memory_metrics.append(row[2].replace('%', '') if isinstance(row[2], str) else row[2])


        conn.close()


        return {
            "timestamps": timestamps,
            "cpu_metrics": cpu_metrics,
            "memory_metrics": memory_metrics
        }


    except Exception as e:
        return {
            "timestamps": [],
            "cpu_metrics": [],
            "memory_metrics": [],
            "error": str(e)
        }
@app.get("/cluster/{cluster_name}")
async def get_cluster_stats(request: Request, cluster_name: str):
    try:
        # Get cluster credentials for SSH connection
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster_info = c.fetchone()
        conn.close()
        
        if not cluster_info:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        # Establish SSH connection
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cluster_info[0], port=cluster_info[1], username=cluster_info[2], password=cluster_info[3])
        
        # Fetch Nodes
        # stdin, stdout, stderr = ssh.exec_command("""
        #     kubectl get nodes -o custom-columns=NAME:.metadata.name,STATUS:.status.conditions[-1].type,ROLES:.metadata.labels.kubernetes\.io/role
        # """)
        # nodes_output = stdout.read().decode('utf-8').strip().split('\n')
        
        # # Parse Nodes
        # nodes = []
        # for line in nodes_output[1:]:  # Skip header
        #     parts = line.split()
        #     if len(parts) >= 3:
        #         nodes.append({
        #             'name': parts[0],
        #             'status': parts[1],
        #             'roles': parts[2]
        #         })
        # Fetch Nodes
        stdin, stdout, stderr = ssh.exec_command("""
            kubectl get nodes -o wide
        """)
        nodes_output = stdout.read().decode('utf-8').strip().split('\n')


        # Parse Nodes
        nodes = []
        for line in nodes_output[1:]:  # Skip header
            parts = line.split()
            if len(parts) >= 2:
                node_name = parts[0]
                status = parts[1]
                
                # Determine roles
                if 'control-plane' in line:
                    role = 'control-plane'
                else:
                    role = 'worker'


                nodes.append({
                    'name': node_name,
                    'status': status,
                    'roles': role
                })    
                
        # Fetch Deployments
        stdin, stdout, stderr = ssh.exec_command("""
            kubectl get deployments --no-headers -o json
        """)
        deployments_json = json.loads(stdout.read().decode('utf-8'))
        
        # Parse Deployments
        deployments = []
        for deployment in deployments_json.get('items', []):
            try:
                namespace = deployment['metadata']['namespace']
                name = deployment['metadata']['name']
                
                # Get containers and images
                containers = deployment['spec']['template']['spec']['containers']
                
                for container in containers:
                    deployments.append({
                        'namespace': namespace,
                        'name': name,
                        'container': container['name'],
                        'image': container['image'],
                        'replicas': deployment['spec'].get('replicas', 0)
                    })
            except Exception as e:
                print(f"Error processing deployment: {e}")
        
        # Fetch Pods
        stdin, stdout, stderr = ssh.exec_command("""
            kubectl get pods --no-headers -o json
        """)
        pods_json = json.loads(stdout.read().decode('utf-8'))
        
        # Parse Pods
        pods = []
        for pod in pods_json.get('items', []):
            try:
                namespace = pod['metadata']['namespace']
                name = pod['metadata']['name']
                node = pod.get('spec', {}).get('nodeName', 'N/A')
                
                # Get containers and images
                containers = pod['spec']['containers']
                
                for container in containers:
                    pods.append({
                        'namespace': namespace,
                        'name': name,
                        'node': node,
                        'container': container['name'],
                        'image': container['image']
                    })
            except Exception as e:
                print(f"Error processing pod: {e}")
        
        # Fetch Node Stats
        node_stats = {}
        for node in nodes:
            try:
                # Fetch historical node stats from database
                conn = sqlite3.connect('cluster_1.db')
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT timestamp, cpu_percent, memory_percent
                    FROM node_stats
                    WHERE node_name = ?
                    ORDER BY timestamp DESC
                    LIMIT 100
                ''', (node['name'],))
                
                historical_stats = cursor.fetchall()
                
                # Format stats for graphing
                node_stats[node['name']] = [
                    [
                        stat[0],  # timestamp
                        str(stat[1]),  # cpu percent
                        str(stat[2])   # memory percent
                    ] for stat in historical_stats
                ]
                
                conn.close()
            except Exception as e:
                print(f"Error fetching node stats for {node['name']}: {e}")
                
                # Fallback to simulated data if no historical data
                node_stats[node['name']] = [
                    [
                        (datetime.now() - timedelta(minutes=i)).strftime("%Y-%m-%d %H:%M:%S"),
                        f"{random.uniform(0, 100):.2f}",  # CPU usage
                        f"{random.uniform(0, 100):.2f}"   # Memory usage
                    ] for i in range(5)
                ]
        
        # Fetch Pod Stats
        pod_stats = {}
        for pod in pods:
            try:
                # Fetch historical pod stats from database
                conn = sqlite3.connect('cluster_1.db')
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT timestamp, cpu_percent, memory_percent
                    FROM pod_stats
                    WHERE pod_name = ?
                    ORDER BY timestamp DESC
                    LIMIT 100
                ''', (pod['name'],))
                
                historical_stats = cursor.fetchall()
                
                # Format stats for graphing
                pod_stats[pod['name']] = [
                    [
                        stat[0],  # timestamp
                        str(stat[1]),  # cpu percent
                        str(stat[2])   # memory percent
                    ] for stat in historical_stats
                ]
                
                conn.close()
            except Exception as e:
                print(f"Error fetching pod stats for {pod['name']}: {e}")
                
                # Fallback to simulated data if no historical data
                pod_stats[pod['name']] = [
                    [
                        (datetime.now() - timedelta(minutes=i)).strftime("%Y-%m-%d %H:%M:%S"),
                        f"{random.uniform(0, 100):.2f}",  # CPU usage
                        f"{random.uniform(0, 100):.2f}"   # Memory usage
                    ] for i in range(5)
                ]
        
        # Prepare Overview
        overview = {
            "totalNodes": len(nodes),
            "totalPods": len(pods),
            "runningPods": len([p for p in pods_json.get('items', []) if p['status']['phase'] == 'Running']),
            "nodeBreakdown": {
                "ready": len([n for n in nodes if n['status'] == 'Ready']),
                "notReady": len([n for n in nodes if n['status'] != 'Ready'])
            }
        }
        
        ssh.close()
        
        # Return comprehensive JSON response
        return {
            "cluster_name": cluster_name,
            "nodes": nodes,
            "node_stats": node_stats,
            "pods": pods,
            "pod_stats": pod_stats,
            "deployments": deployments,
            "overview": overview
        }
    
    except paramiko.AuthenticationException:
        raise HTTPException(status_code=401, detail="SSH Authentication failed")
    except paramiko.SSHException as ssh_error:
        raise HTTPException(status_code=500, detail=f"SSH connection error: {str(ssh_error)}")
    except Exception as e:
        print(f"Error in get_cluster_stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/cluster/{cluster_name}/services")
async def get_cluster_services(cluster_name: str):
    try:
        # Establish database connection and fetch cluster details
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        
        # Fetch cluster details using the cluster_name
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()
        
        if not cluster:
            raise HTTPException(
                status_code=404, 
                detail=f"Cluster '{cluster_name}' not found"
            )
        
        cluster_ip, port, username, password = cluster
        
        # Use Paramiko to execute kubectl command via SSH
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            ssh.connect(
                hostname=cluster_ip, 
                username=username, 
                password=password,
                port=port  # Use the port from the database
            )
            
            # Execute standard kubectl get services command
            stdin, stdout, stderr = ssh.exec_command(
                "kubectl get services"
            )
            
            # Capture any potential errors
            error_output = stderr.read().decode('utf-8').strip()
            if error_output:
                raise Exception(f"kubectl error: {error_output}")
            
            # Read and parse the output
            services_output = stdout.read().decode('utf-8').strip().split('\n')
            
            # Parse services (skip header)
            services = []
            for line in services_output[1:]:
                # Split the line, handling potential whitespace variations
                parts = line.split()
                
                # Ensure we have enough parts to create a service
                if len(parts) >= 5:
                    service_name = parts[0]
                    service_type = parts[1]
                    service_cluster_ip = parts[2]
                    ports = parts[4]  # PORT(S) column
                    
                    # Process ports based on service type
                    if service_type == "ClusterIP":
                        # For ClusterIP, use the first port
                        service_port = ports.split('/')[0] if '/' in ports else ports
                    elif service_type == "NodePort":
                        # For NodePort, extract the port after the colon
                        if ':' in ports:
                            service_port = ports.split(':')[1].split('/')[0]
                        else:
                            service_port = ports.split('/')[0]
                    else:
                        service_port = None
                    
                    service = {
                        'name': service_name,
                        'type': service_type,
                        'clusterIP': service_cluster_ip,
                        'ports': service_port
                    }
                    services.append(service)
            
            return {
                'cluster_ip': cluster_ip,  # The IP of the cluster itself
                'services': services
            }
        
        except paramiko.AuthenticationException:
            raise HTTPException(status_code=403, detail="Authentication failed")
        except paramiko.SSHException as ssh_exception:
            raise HTTPException(status_code=500, detail=f"SSH connection error: {str(ssh_exception)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching services: {str(e)}")
        finally:
            ssh.close()
    
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
@app.post("/add_cluster")
async def add_cluster(cluster: ClusterCredentials):
    global clusters
    try:
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute('''
            INSERT INTO clusters (name, ip, port, username, password, interval)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (cluster.name, cluster.ip, cluster.port, cluster.username, cluster.password, cluster.interval))
        conn.commit()
        conn.close()

        # Update in-memory data structure
        clusters[cluster.name] = {
            'name': cluster.name,
            'ip': cluster.ip,
            'port': cluster.port,
            'username': cluster.username,
            'password': cluster.password,
            'interval': cluster.interval
        }

        # Start background tasks
        asyncio.create_task(collect_cluster_stats(cluster.name, cluster.interval)).set_name(f"collect_{cluster.name}")
        asyncio.create_task(collect_pod_stats(cluster.name, cluster.interval)).set_name(f"collect_pods_{cluster.name}")

        return {"message": f"Cluster '{cluster.name}' added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add cluster: {str(e)}")

from fastapi import FastAPI, Form, HTTPException
from typing import Optional


@app.post("/open_terminal")
async def open_terminal(
    cluster_name: Optional[str] = Form(None)  # Make it optional
):
    # Validate input
    if not cluster_name:
        raise HTTPException(
            status_code=400, 
            detail="Cluster name is required"
        )
    
    try:
        # Connect to the database to fetch cluster details
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute("SELECT ip FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()
        conn.close()

        if not cluster:
            raise HTTPException(
                status_code=404, 
                detail=f"Cluster '{cluster_name}' not found"
            )
        
        # Use the cluster IP for the terminal URL
        cluster_ip = cluster[0]
        terminal_url = f"https://{cluster_ip}:4200/"
        
        return {"terminal_url": terminal_url}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch terminal URL: {str(e)}"
        )

def execute_kubectl_command(ssh_client, command: str) -> str:
    try:
        

        # Execute kubectl command over SSH
        stdin, stdout, stderr = ssh_client.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()

        if error:
            raise Exception(f"Error: {error}")
        
        return output
    except Exception as e:
        return str(e)
    finally:
        ssh_client.close()


@app.post("/update_image")
async def update_image(
    cluster_name: str = Form(...),
    deployment: str = Form(...), 
    container: str = Form(...), 
    newImage: str = Form(...),
    namespace: str = Form(...)
):
    try:
         # Get cluster credentials
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])

        conn.close()
        if newImage:
            command = f"kubectl set image deployment/{deployment} {container}={newImage}"
            result = execute_kubectl_command(ssh, command)
            return JSONResponse(content={"message": f"Image update result: {result}"})
        return JSONResponse(content={"message": "No image provided"})
    
    except paramiko.AuthenticationException:
        raise HTTPException(status_code=401, detail="Authentication failed")
    except paramiko.SSHException as ssh_exception:
        raise HTTPException(status_code=500, detail=f"SSH connection error: {str(ssh_exception)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  




@app.post("/update_replicas")
async def update_replicas(
    cluster_name: str = Form(...),
    deployment_name: str = Form(...), 
    replicas: int = Form(...)
):
    try:
        # Validate replica count
        if replicas < 0:
            return JSONResponse(content={
                "error": "Replica count must be a non-negative integer"
            }, status_code=400)


        # Get cluster credentials
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()
        conn.close()


        if not cluster:
            return JSONResponse(content={"error": f"Cluster '{cluster_name}' not found"}, status_code=404)


        # Create SSH connection
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])


        # First, get current replica count to provide context
        current_replicas_cmd = f"kubectl get deployment {deployment_name} -o=jsonpath='{{.spec.replicas}}'"
        stdin, stdout, stderr = ssh.exec_command(current_replicas_cmd)
        current_replicas = stdout.read().decode('utf-8').strip()


        # Construct kubectl command to scale deployment
        command = f"kubectl scale deployment {deployment_name} --replicas={replicas}"
        
        # Execute the command
        stdin, stdout, stderr = ssh.exec_command(command)
        
        # Read output and error streams
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        ssh.close()


        # Check for errors
        if error:
            return JSONResponse(content={
                "error": f"Failed to update replicas: {error}",
                "command": command
            }, status_code=500)


        return JSONResponse(content={
            "message": "Replicas updated successfully",
            "previous_replicas": current_replicas,
            "new_replicas": replicas,
            "output": output
        })


    except Exception as e:
        return JSONResponse(content={
            "error": f"An unexpected error occurred: {str(e)}"
        }, status_code=500)
# Explicit YAML import with error handling
try:
    import yaml
except ImportError:
    print("PyYAML is not installed. Attempting to install...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml"])
    import yaml
def validate_yaml_file(file_path):
    try:
        # Read file contents
        with open(file_path, 'r') as f:
            file_contents = f.read()
            print("Full File Contents:")
            print(file_contents)
        
        # Handle multi-document YAML files
        yaml_docs = list(yaml.safe_load_all(file_contents))
        
        # Debugging print
        print(f"Number of YAML documents: {len(yaml_docs)}")
        
        # Validate each document
        validated_docs = []
        for doc_index, doc in enumerate(yaml_docs, 1):
            # Skip None/empty documents
            if doc is None:
                print(f"Skipping empty document {doc_index}")
                continue
            
            # Detailed document validation
            if not isinstance(doc, dict):
                raise ValueError(f"Document {doc_index} is not a valid YAML object")
            
            # Check for required Kubernetes resource keys
            required_keys = ['kind', 'apiVersion']
            missing_keys = [key for key in required_keys if key not in doc]
            
            if missing_keys:
                # Detailed error with document contents
                print(f"Document {doc_index} details:")
                print(yaml.dump(doc))
                raise ValueError(
                    f"Invalid Kubernetes resource in document {doc_index}: "
                    f"Missing {', '.join(missing_keys)}"
                )
            
            # Additional validation for specific resource types
            if doc.get('kind') == 'Deployment':
                if 'metadata' not in doc:
                    raise ValueError(f"Deployment in document {doc_index} missing 'metadata'")
                if 'spec' not in doc:
                    raise ValueError(f"Deployment in document {doc_index} missing 'spec'")
            
            validated_docs.append(doc)
        
        # Ensure at least one valid document
        if not validated_docs:
            raise ValueError("No valid Kubernetes resources found in the YAML file")
        
        return validated_docs
    
    except yaml.YAMLError as e:
        # Detailed YAML parsing error
        print("YAML Parsing Error:")
        print(f"Error details: {str(e)}")
        
        # If possible, print the problematic part of the file
        if hasattr(e, 'problem_mark'):
            print(f"Error position: line {e.problem_mark.line + 1}, column {e.problem_mark.column + 1}")
        
        raise ValueError(f"Invalid YAML syntax: {str(e)}")
    
    except Exception as e:
        # Catch-all for other validation errors
        print(f"Validation Error: {str(e)}")
        raise ValueError(f"YAML validation error: {str(e)}")




@app.post("/upload_deployment")
async def upload_deployment(
    cluster_name: str = Form(...),
    file: UploadFile = File(...)
):
    conn = None
    local_file_path = None
    try:
        # Database Connection
        conn = sqlite3.connect('cluster_1.db')
        cursor = conn.cursor()
        
        # Fetch cluster connection details
        cursor.execute("""
            SELECT ip, port, username, password 
            FROM clusters 
            WHERE name = ?
        """, (cluster_name,))
        
        cluster_details = cursor.fetchone()
        
        if not cluster_details:
            return JSONResponse(
                content={"error": f"Cluster '{cluster_name}' not found"},
                status_code=404
            )
        
        # Unpack cluster details
        SSH_HOST, SSH_PORT, SSH_USER, SSH_PASSWORD = cluster_details


        # Ensure local temporary directory exists
        local_temp_dir = os.path.join(os.path.dirname(__file__), "temp_uploads")
        os.makedirs(local_temp_dir, exist_ok=True)


        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        local_file_path = os.path.join(local_temp_dir, unique_filename)


        # Save the uploaded file temporarily
        with open(local_file_path, "wb") as f:
            f.write(await file.read())


          # Validate YAML file with comprehensive logging
        try:
            print("Starting YAML Validation")
            validated_yaml_docs = validate_yaml_file(local_file_path)
            
            print("Validated YAML Documents:")
            for doc_index, doc in enumerate(validated_yaml_docs, 1):
                print(f"Document {doc_index}:")
                print(yaml.dump(doc))
        
        except ValueError as yaml_error:
            print(f"YAML Validation Failed: {str(yaml_error)}")
            return JSONResponse(
                content={
                    "error": "YAML Validation Failed",
                    "details": str(yaml_error)
                },
                status_code=400
            )


        # Define remote upload directory
        remote_upload_dir = f"/home/{SSH_USER}/uploads/"


        # SSH and SFTP Upload Function
        def upload_file_to_remote(local_path, remote_path):
            try:
                # Establish SSH connection
                ssh_client = paramiko.SSHClient()
                ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh_client.connect(
                    SSH_HOST, 
                    port=SSH_PORT, 
                    username=SSH_USER, 
                    password=SSH_PASSWORD
                )


                # Create SFTP session
                sftp_client = ssh_client.open_sftp()


                # Ensure remote directory exists
                try:
                    sftp_client.stat(remote_upload_dir)
                except FileNotFoundError:
                    # Create directory if it doesn't exist
                    sftp_client.mkdir(remote_upload_dir)


                # Upload file
                sftp_client.put(local_path, remote_path)


                # Close connections
                sftp_client.close()
                ssh_client.close()


                return f"File uploaded to {remote_path}"
            except Exception as e:
                raise Exception(f"Upload failed: {str(e)}")


        # Prepare remote file path
        remote_file_path = os.path.join(remote_upload_dir, unique_filename).replace("\\", "/")


        # Upload file to remote server
        upload_result = upload_file_to_remote(local_file_path, remote_file_path)


        # Execute kubectl command
        def execute_remote_command(command):
            try:
                ssh_client = paramiko.SSHClient()
                ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                ssh_client.connect(
                    SSH_HOST, 
                    port=SSH_PORT, 
                    username=SSH_USER, 
                    password=SSH_PASSWORD
                )


                # Execute command with validation disabled
                kubectl_command = f"{command} --validate=false"
                print(f"Executing command: {kubectl_command}")


                stdin, stdout, stderr = ssh_client.exec_command(kubectl_command)
                
                # Read output
                output = stdout.read().decode('utf-8')
                error = stderr.read().decode('utf-8')


                ssh_client.close()


                # Log full output and error
                print("Kubectl Output:", output)
                print("Kubectl Error:", error)


                if error and "created" not in output.lower():
                    raise Exception(f"Command error: {error}")
                
                return output
            except Exception as e:
                raise Exception(f"SSH command failed: {str(e)}")


        # Apply deployment
        kubectl_command = f"kubectl apply -f {remote_file_path}"
        kubectl_result = execute_remote_command(kubectl_command)


        # Clean up local temporary file
        if local_file_path and os.path.exists(local_file_path):
            os.remove(local_file_path)


        return JSONResponse(content={
            "message": "Deployment uploaded and applied successfully",
            "upload_result": upload_result,
            "kubectl_result": kubectl_result,
            "filename": file.filename
        })


    except Exception as e:
        # Comprehensive error handling
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()  # Print full stack trace


        # Clean up temporary file if it exists
        if local_file_path and os.path.exists(local_file_path):
            try:
                os.remove(local_file_path)
            except Exception as cleanup_error:
                print(f"Error cleaning up temporary file: {str(cleanup_error)}")


        return JSONResponse(
            content={
                "error": f"Deployment upload failed: {str(e)}",
                "details": str(e),
                "traceback": traceback.format_exc()
            },
            status_code=500
        )
    finally:
        # Ensure database connection is closed
        if conn:
            conn.close()


@app.get("/deployments_data")
async def get_deployments_data(cluster_name: str):
    try:
        # Get cluster credentials
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()
        conn.close()


        if not cluster:
            return JSONResponse(content={"error": f"Cluster '{cluster_name}' not found"}, status_code=404)


        # Create SSH connection
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])


        # Construct kubectl command to get deployments
        command = "kubectl get deployments -o jsonpath='{range .items[*]}{.metadata.name}{\"\\t\"}{.spec.template.spec.containers[0].name}{\"\\t\"}{.spec.template.spec.containers[0].image}{\"\\t\"}{.spec.replicas}{\"\\n\"}{end}'"
        
        # Execute the command
        stdin, stdout, stderr = ssh.exec_command(command)
        
        # Read output
        deployments_data = stdout.read().decode('utf-8')
        
        ssh.close()


        # Parse the deployments data
        deployments_list = []
        for line in deployments_data.strip().split('\n'):
            if line:
                parts = line.split('\t')
                deployments_list.append({
                    "deployment": parts[0],
                    "container": parts[1],
                    "image": parts[2],
                    "replicas": parts[3]
                })


        return JSONResponse(content=deployments_list)


    except Exception as e:
        return JSONResponse(content={
            "error": f"An unexpected error occurred: {str(e)}"
        }, status_code=500)
from fastapi import HTTPException
from pydantic import conint


@app.post("/delete_cluster/{cluster_name}")
async def delete_cluster(cluster_name: str):
    try:
        # Connect to the database
        conn = sqlite3.connect('cluster_1.db')
        cursor = conn.cursor()

        # Check if the cluster exists
        cursor.execute("SELECT * FROM clusters WHERE name = ?", (cluster_name,))
        cluster = cursor.fetchone()

        if not cluster:
            raise HTTPException(status_code=404, detail=f"Cluster '{cluster_name}' not found")

        # Delete associated records
        cursor.execute("DELETE FROM cluster_stats WHERE cluster_name = ?", (cluster_name,))
        cursor.execute("DELETE FROM pods WHERE cluster_name = ?", (cluster_name,))
        cursor.execute("DELETE FROM clusters WHERE name = ?", (cluster_name,))

        # Commit the changes
        conn.commit()

        return {
            "status": "success",
            "message": f"Cluster '{cluster_name}' deleted successfully",
            "cluster_name": cluster_name
        }
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        if conn:
            conn.close()
# @app.get("/get_pod_metrics")
# async def get_pod_metrics(pod_name: str):  # Changed from 'pod' to 'pod_name'
#     try:
#         conn = sqlite3.connect('cluster_1.db')
#         c = conn.cursor()
#         c.execute("""
#             SELECT timestamp, cpu_percent, memory_percent 
#             FROM pod_stats 
#             WHERE pod_name = ? 
#             ORDER BY timestamp DESC 
#             LIMIT 100
#         """, (pod_name,))
#         results = c.fetchall()
#         conn.close()


#         timestamps = [row[0] for row in results][::-1]
#         cpu_metrics = [float(row[1]) for row in results][::-1]
#         memory_metrics = [float(row[2]) for row in results][::-1]


#         return {
#             "timestamps": timestamps,
#             "cpu_metrics": cpu_metrics,
#             "memory_metrics": memory_metrics
#         }
#     except Exception as e:
#         print(f"Error fetching pod metrics: {str(e)}")
#         return {"error": "An error occurred while fetching pod metrics."}
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Query, HTTPException
import sqlite3


@app.get("/get_pod_metrics")
async def get_pod_metrics(
    pod_name: str, 
    time_range: str = Query(default='latest', enum=['latest', '1h', '6h', '12h', '24h', '7d']),
    cluster_name: Optional[str] = None
):
    try:
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()


        # If cluster_name is not provided, try to find it
        if not cluster_name:
            c.execute("""
                SELECT cluster_name FROM pods 
                WHERE pod_name = ?
            """, (pod_name,))
            
            cluster_result = c.fetchone()
            
            if not cluster_result:
                return {
                    "timestamps": [],
                    "cpu_metrics": [],
                    "memory_metrics": [],
                    "error": f"No cluster found for pod {pod_name}"
                }
            
            cluster_name = cluster_result[0]


        # Get current time
        current_time = datetime.now()


        # Determine time window and sampling strategy
        if time_range == 'latest':
            time_window = (current_time - timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S')
            query = '''
                SELECT timestamp, cpu_percent, memory_percent
                FROM pod_stats
                WHERE pod_name = ? AND timestamp >= ?
                ORDER BY timestamp DESC
                LIMIT 60
            '''
            params = (pod_name, time_window)
        
        elif time_range == '1h':
            time_window = (current_time - timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')
            query = '''
                SELECT timestamp, cpu_percent, memory_percent
                FROM pod_stats
                WHERE pod_name = ? AND timestamp >= ?
                ORDER BY timestamp
            '''
            params = (pod_name, time_window)
        
        elif time_range == '6h':
            time_window = (current_time - timedelta(hours=6)).strftime('%Y-%m-%d %H:%M:%S')
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM pod_stats
                    WHERE pod_name = ? AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 5 = 0
                ORDER BY timestamp
            '''
            params = (pod_name, time_window)
        
        elif time_range == '12h':
            time_window = (current_time - timedelta(hours=12)).strftime('%Y-%m-%d %H:%M:%S')
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM pod_stats
                    WHERE pod_name = ? AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 10 = 0
                ORDER BY timestamp
            '''
            params = (pod_name, time_window)
        
        elif time_range == '24h':
            time_window = (current_time - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM pod_stats
                    WHERE pod_name = ? AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 15 = 0
                ORDER BY timestamp
            '''
            params = (pod_name, time_window)
        
        elif time_range == '7d':
            time_window = (current_time - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
            query = '''
                WITH RankedMetrics AS (
                    SELECT 
                        timestamp, 
                        cpu_percent, 
                        memory_percent,
                        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                    FROM pod_stats
                    WHERE pod_name = ? AND timestamp >= ?
                )
                SELECT timestamp, cpu_percent, memory_percent
                FROM RankedMetrics
                WHERE row_num % 60 = 0
                ORDER BY timestamp
            '''
            params = (pod_name, time_window)
        
        else:
            return {
                "timestamps": [],
                "cpu_metrics": [],
                "memory_metrics": [],
                "error": "Invalid time range"
            }


        # Execute the query
        c.execute(query, params)
        rows = c.fetchall()


        # Process results
        if not rows:
            return {
                "timestamps": [],
                "cpu_metrics": [],
                "memory_metrics": [],
                "error": "No data found for the specified time range."
            }


        # Extract and process data
        timestamps = []
        cpu_metrics = []
        memory_metrics = []


        for row in rows:
            timestamps.append(row[0])
            cpu_metrics.append(row[1].replace('%', '') if isinstance(row[1], str) else row[1])
            memory_metrics.append(row[2].replace('%', '') if isinstance(row[2], str) else row[2])


        conn.close()


        return {
            "timestamps": timestamps,
            "cpu_metrics": cpu_metrics,
            "memory_metrics": memory_metrics,
            "cluster_name": cluster_name
        }


    except Exception as e:
        return {
            "timestamps": [],
            "cpu_metrics": [],
            "memory_metrics": [],
            "error": str(e)
        }
    finally:
        conn.close()
# Function to add a new VM resource to the database
def add_vm_resource(vm_name, ip_address, status='registered', power_state='off'):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO vm_resources (vm_name, ip_address, status, power_state)
            VALUES (?, ?, ?, ?)
        """, (vm_name, ip_address, status, power_state))
        conn.commit()


# Function to unregister a VM resource from the database
def unregister_vm_resource(vm_name):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM vm_resources WHERE vm_name = ?
        """, (vm_name,))
        conn.commit()


# Function to update the status of a VM resource
def update_vm_resource_status(vm_name, status):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE vm_resources SET status = ? WHERE vm_name = ?
        """, (status, vm_name))
        conn.commit()
def insert_pod_metrics(pod_name: str, timestamp: str, cpu_usage: str, memory_usage: str):
    try:
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        
        # Convert CPU and memory usage to percentages (remove units and convert if necessary)
        cpu_percent = float(cpu_usage.replace('Cpu: ', '').strip())
        memory_percent = float(memory_usage.replace('Memory: ', '').strip().replace('Ki', '')) / 1024  # Convert Ki to Mi
        
        c.execute("INSERT INTO pod_stats (pod_name, timestamp, cpu_percent, memory_percent) VALUES (?, ?, ?, ?)",
                  (pod_name, timestamp, cpu_percent, memory_percent))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error inserting pod metrics: {str(e)}")

@app.post("/insert_pod_metrics")
async def insert_pod_metrics_from_command(pod_name: str):
    try:
        # Execute the kubectl command and get the output
        command = ["kubectl", "describe", "PodMetrics", pod_name]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        output = result.stdout
        
        # Print the output for debugging
        print("kubectl describe output:", output)
        
        # Parse the output to extract CPU and memory usage
        lines = output.splitlines()
        
        cpu_usage_line = next((line for line in lines if line.startswith("    Cpu:")), None)
        memory_usage_line = next((line for line in lines if line.startswith("    Memory:")), None)
        timestamp_line = next((line for line in lines if line.startswith("Timestamp:")), None)
        
        if not cpu_usage_line or not memory_usage_line or not timestamp_line:
            return {"error": "Unable to find required metrics in the kubectl output."}
        
        cpu_usage = cpu_usage_line.strip().split(":")[1].strip()
        memory_usage = memory_usage_line.strip().split(":")[1].strip()
        timestamp = timestamp_line.strip().split(":")[1].strip()
        
        # Print the parsed values for debugging
        print(f"Parsed values - CPU: {cpu_usage}, Memory: {memory_usage}, Timestamp: {timestamp}")
        
        # Insert the data into the database
        insert_pod_metrics(pod_name, timestamp, cpu_usage, memory_usage)
        
        return {"message": "Pod metrics inserted successfully."}
    except Exception as e:
        print(f"Error inserting pod metrics from command: {str(e)}")
        return {"error": "An error occurred while inserting pod metrics."}

# Endpoint to get deployments for the cluster
@app.get("/get_deployments")
async def get_deployments(cluster_name: str):
    try:
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()
        conn.close()

        if not cluster:
            return {"error": f"Cluster '{cluster_name}' not found"}

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])

        command = "kubectl get deployments --all-namespaces -o json"
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')

        ssh.close()

        if error:
            return {"error": error}

        # Return deployments data (you might need to parse the JSON)
        return JSONResponse(content={"deployments": output})
    except Exception as e:
        return {"error": f"Failed to get deployments: {str(e)}"}





@app.post("/update_replicas")
async def update_replicas(
    cluster_name: str = Form(...),
    deployment_name: str = Form(...), 
    replicas: int = Form(...)
):
    try:
        # Get cluster credentials
        conn = sqlite3.connect('cluster_1.db')
        c = conn.cursor()
        c.execute("SELECT ip, port, username, password FROM clusters WHERE name = ?", (cluster_name,))
        cluster = c.fetchone()
        conn.close()


        if not cluster:
            raise HTTPException(status_code=404, detail=f"Cluster '{cluster_name}' not found")


        # Validate replica count
        if replicas < 0:
            raise HTTPException(status_code=400, detail="Replica count cannot be negative")


        # Create SSH connection
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(cluster[0], port=cluster[1], username=cluster[2], password=cluster[3])


        # First, check current replica count
        current_replicas_cmd = f"kubectl get deployment {deployment_name} -o=jsonpath='{{.spec.replicas}}'"
        stdin, stdout, stderr = ssh.exec_command(current_replicas_cmd)
        current_replicas = int(stdout.read().decode('utf-8').strip() or 0)


        # Construct kubectl command to scale deployment
        command = f"kubectl scale deployment {deployment_name} --replicas={replicas}"
        
        # Execute the command
        stdin, stdout, stderr = ssh.exec_command(command)
        
        # Read output and error streams
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        ssh.close()


        # Check for errors
        if error:
            raise HTTPException(status_code=500, detail=f"Failed to scale deployment: {error}")


        return {
            "message": "Replicas updated successfully",
            "previous_replicas": current_replicas,
            "new_replicas": replicas,
            "output": output
        }


    except paramiko.AuthenticationException:
        raise HTTPException(status_code=401, detail="Authentication failed")
    except paramiko.SSHException as ssh_exception:
        raise HTTPException(status_code=500, detail=f"SSH connection error: {str(ssh_exception)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   


###################################################################################################################
####################################Scalng code#####################################################################
####################################################################################################################

def connect_to_esxi_ssh():

        # Replace with your ESXi credentials and datastore/VM details
    host = "10.200.7.20"
    user = "root"
    password = "CH@cloud#01!!"
    port = 22
    
    """Connect to the ESXi host via SSH."""
    try:
        # Establish SSH connection
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_client.connect(host, username=user, password=password, port=port)
        print(f"Successfully connected to {host} via SSH")
        return ssh_client
    except Exception as e:
        print(f"Failed to connect to {host} via SSH: {e}")
        return None

class NodeDetails(BaseModel):
    cluster_name: str
    ip: str
    username: str
    password: str
    port: str

@app.post("/manual_add_node/")
def manual_add_node(node_details: NodeDetails):
    cluster_name = node_details.cluster_name
    ip = node_details.ip
    username = node_details.username
    password = node_details.password
    port = node_details.port

    print(f"Cluster Name: {cluster_name}")
    print(f"IP: {ip}")
    print(f"Username: {username}")
    print(f"Password: {password}")
    print(f"Port: {port}")

    conn = sqlite3.connect('cluster_1.db')
    cursor = conn.cursor()

    cursor.execute("SELECT ip, username, password, port FROM clusters WHERE name = ?", (cluster_name,))
    cluster_details = cursor.fetchone()

    target_ip_master, username_master, password_master, port_master = cluster_details
    # Return the received data
    
    hostname1= add_node(
        target_ip_master, username_master, password_master, port_master,
        ip,username,password,port
    )

    # hostname1 = "abc"
    return {"hostname": hostname1}

def add_node(
    target_ip_master, username_master, password_master, port_master,
    target_ip_worker, username_worker, password_worker, port_worker
):
    
    # Credentials for ansible the remote server CAN be left hard coded
    remote_ip = "10.200.16.17"  # Replace with remote server IP
    remote_user = "project"  # Replace with remote server username
    remote_password = "project"  # Replace with remote server password
    remote_port = 22  # Replace with the remote server SSH port
    try:

        ## Logic to reterive hostname of worker node
        worker_hostname = None
        try:
            worker_ssh = paramiko.SSHClient()
            worker_ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            worker_ssh.connect(
                hostname=target_ip_worker,
                username=username_worker,
                password=password_worker,
                port=port_worker
            )
            stdin, stdout, stderr = worker_ssh.exec_command("hostname")
            worker_hostname = stdout.read().strip().decode('utf-8')
            print(f"worker ip:{target_ip_worker}")
            print(f"Retrieved worker hostname: {worker_hostname}")
            worker_ssh.close()
        except Exception as e:
            print(f"Failed to retrieve worker hostname: {e}")
            return
        
        # Establish SSH connection to the remote server
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(remote_ip, username=remote_user, password=remote_password, port=remote_port)

        # Remote file path
        remote_file = '/home/project/ans/plays/add_hosts'

        # Generate the line to add
 # Generate the lines to add
        line_to_add_master = f"{target_ip_master} ansible_user={username_master} ansible_ssh_pass={password_master} ansible_become_pass={password_master} ansible_port={port_master}"
        line_to_add_worker = f"{target_ip_worker} ansible_user={username_worker} ansible_ssh_pass={password_worker} ansible_become_pass={password_worker} ansible_port={port_worker}"
        line_to_add_vars = f"master_ip={target_ip_master}\nworker_user={username_worker}\n"

        # Use SFTP to read and modify the file
        sftp = ssh.open_sftp()
        try:
            # Read the file content
            with sftp.open(remote_file, 'r') as file:
                lines = file.readlines()

            # Find the [master] and [worker] lines and insert the new lines below them
            updated_lines = []
            added_master = False
            added_worker = False
            added_vars = False
            for line in lines:
                updated_lines.append(line)
                if '[master]' in line and not added_master:
                    updated_lines.append(f"{line_to_add_master}\n")
                    added_master = True
                if '[worker]' in line and not added_worker:
                    updated_lines.append(f"{line_to_add_worker}\n")
                    added_worker = True
                if '[all:vars]' in line and not added_vars:
                    updated_lines.append(f"{line_to_add_vars}\n")
                    added_vars = True

            if not added_master:
                raise Exception("The '[master]' section was not found in the file.")
            if not added_worker:
                raise Exception("The '[worker]' section was not found in the file.")
            if not added_vars:
                raise Exception("The '[all:vars]' section was not found in the file.")
            

            # Write the updated content back to the file
            with sftp.open(remote_file, 'w') as file:
                file.writelines(updated_lines)

            print(f"Successfully added the lines to {remote_file} on {remote_ip}.")
        
        ## For troubleshooting Ping test
            # ansible_command = f"ANSIBLE_HOST_KEY_CHECKING=False ansible -i /home/project/ans/plays/hosts -m ping all"
            # print(f"Running Ansible command on remote server: {ansible_command}")

            # sudo_command = f"echo {remote_password} | sudo -S {ansible_command}"

            # stdin, stdout, stderr = ssh.exec_command(sudo_command)
            # stdout_lines = stdout.readlines()
            # stderr_lines = stderr.readlines()

            # print("Ansible Command Output:")
            # for line in stdout_lines:
            #     print(line.strip())

            # if stderr_lines:
            #     print("Ansible Command Errors:")
            #     for line in stderr_lines:
            #         print(line.strip())

            # if stdout.channel.recv_exit_status() == 0:
            #     print("Ansible command executed successfully.")
            # else:
            #     print("Ansible command failed.")

            ## Ansible plybook to add node

            ansible_command = f"ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i /home/project/ans/plays/add_hosts /home/project/ans/plays/join.yml -e \"node_to_remove={worker_hostname}\""
            print(f"Running Ansible command on remote server: {ansible_command}")

            sudo_command = f"echo {remote_password} | sudo -S {ansible_command}"

            stdin, stdout, stderr = ssh.exec_command(sudo_command)
            stdout_lines = stdout.readlines()
            stderr_lines = stderr.readlines()

            print("Ansible Command Output:")
            for line in stdout_lines:
                print(line.strip())

            if stderr_lines:
                print("Ansible Command Errors:")
                for line in stderr_lines:
                    print(line.strip())

            if stdout.channel.recv_exit_status() == 0:
                print("Ansible command executed successfully.")
            else:
                print("Ansible command failed.")

            updated_lines = []
            for line in lines:
                if line.strip() == line_to_add_master.strip():
                    continue
                if line.strip() == line_to_add_worker.strip():
                    continue
                if line.strip() == line_to_add_vars.strip():
                    continue
                updated_lines.append(line)

                # Write the cleaned-up content back to the file
            with sftp.open(remote_file, 'w') as file:
                file.writelines(updated_lines)

            print(f"Successfully removed the added lines from {remote_file}.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            ssh.close()
            return worker_hostname
    except Exception as e:
        print(f"Failed to update the file: {e}")

def power_on_vm_ssh(connect_to_esxi_ssh, vm_name):

    """
    Power on a VM using SSH on an ESXi host.

    :param connect_to_esxi_ssh: Function to establish SSH connection to ESXi host.
    :param vm_name: Name of the virtual machine to power on.
    """
    ssh = connect_to_esxi_ssh()
    if ssh is None:
        print("Failed to establish an SSH connection to the ESXi host.")
        return

    try:
        # Get the list of VMs and their IDs
        stdin, stdout, stderr = ssh.exec_command("vim-cmd vmsvc/getallvms")
        vm_list = stdout.read().decode('utf-8')
        if vm_name not in vm_list:
            print(f"VM '{vm_name}' not found on the host.")
            return

        # Find the VM ID
        vm_id = None
        for line in vm_list.splitlines():
            if vm_name in line:
                vm_id = line.split()[0]
                break

        if vm_id is None:
            print(f"VM '{vm_name}' not found in the list.")
            return

        # Power on the VM using its ID
        power_on_command = f"vim-cmd vmsvc/power.on {vm_id}"
        stdin, stdout, stderr = ssh.exec_command(power_on_command)
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')

        if "Powered on" in output:
            print(f"VM '{vm_name}' powered on successfully.")
        elif error:
            print(f"Error powering on VM '{vm_name}': {error}")
        else:
            print(f"Unknown response: {output}")

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        ssh.close()
        print("Disconnected from ESXi host.")


def power_off_vm_ssh(connect_to_exsi_ssh, vm_name,flag):
    """
    Power off a VM using SSH on an ESXi host.

    :param esxi_host: ESXi host address
    :param esxi_user: Username for the ESXi host
    :param esxi_password: Password for the ESXi host
    :param vm_name: Name of the virtual machine to power off
    """
    ssh = connect_to_esxi_ssh()
    if ssh is None:
        print("Failed to establish an SSH connection to the ESXi host.")
        return
    

    # Get the list of VMs and their IDs
    stdin, stdout, stderr = ssh.exec_command("vim-cmd vmsvc/getallvms")
    vm_list = stdout.read().decode('utf-8')
    if vm_name not in vm_list:
        print(f"VM '{vm_name}' not found on the host.")
        return

    # Find the VM ID
    for line in vm_list.splitlines():
        if vm_name in line:
            vm_id = line.split()[0]
            break
    else:
        print(f"VM '{vm_name}' not found in the list.")
        return

    # Power off the VM using its ID
    power_off_command = f"vim-cmd vmsvc/power.off {vm_id}"
    stdin, stdout, stderr = ssh.exec_command(power_off_command)
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')

    print(output)
    print(f"VM '{vm_name}' powered off successfully.")
    if flag != True:
        try:
            # Connect to the SQLite database
            print("connecting to db")
            conn = sqlite3.connect('cluster_1.db')
            cursor = conn.cursor()
            print("connected to db")
            # Execute the update query to set power_status to 'off' for the given vm_name
            cursor.execute("""
                            UPDATE registered_node
                            SET power_status = 'off' , cluster_ip = ?
                            WHERE vm_name = ?
                            """, (None, vm_name,))
            
            # Commit the changes
            conn.commit()
            
            # Check if any rows were affected
            if cursor.rowcount > 0:
                print(f"Successfully updated power_status for {vm_name} to 'off'.")
            else:
                print(f"No record found for {vm_name}.")
        
        except sqlite3.Error as e:
            print(f"SQLite error occurred: {e}")
        
        finally:
            # Close the connection
            conn.close()


    ssh.close()


def create_new_vm(connect_to_esxi_ssh, folder_name, new_name):
    """
    Register a VM using vim-cmd over SSH and return the VM name based on the newly created VM's ID.

    :param connect_to_esxi_ssh: Function to establish SSH connection to ESXi host.
    :param folder_name: Folder where the VM's files are located.
    :param new_name: Name of the new VM.
    :return: Name of the newly created VM or None if an error occurs.
    """
    ssh = connect_to_esxi_ssh()
    if ssh is None:
        print("Failed to establish an SSH connection to the ESXi host.")
        return None

    datastore_name = "DATA_7.20"
    try:
        # Construct the .vmx path
        vmx_path = f"/vmfs/volumes/{datastore_name}/{folder_name}/{new_name}.vmx"
        print(f"VMX Path: {vmx_path}")
        
        # Register the VM and capture its ID
        command = f"vim-cmd solo/registervm {vmx_path}"
        stdin, stdout, stderr = ssh.exec_command(command)
        
        # Capture command output and error
        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        
        if error:
            print(f"VM registration error: {error}")
            raise Exception(f"Error during VM registration: {error}")
        
        print(f"VM registered successfully. Output: {output}")
        
        # Parse the VM ID from the output
        vm_id = output.strip()  # Typically, the output is the VM ID
        print(f"Registered VM ID: {vm_id}")
        
        # Retrieve VM details for the given VM ID
        command = f"vim-cmd vmsvc/get.summary {vm_id}"
        stdin, stdout, stderr = ssh.exec_command(command)
        vm_summary_output = stdout.read().decode()
        error = stderr.read().decode()
        
        if error:
            print(f"Error retrieving VM summary: {error}")
            raise Exception(f"Error retrieving VM summary: {error}")
        
        # Extract VM name from the summary
        for line in vm_summary_output.splitlines():
            if "name" in line:
                vm_name = line.split('"')[1]  # Extract the value inside quotes
                print(f"VM Name: {vm_name}")
                return vm_name
        
        raise Exception(f"VM name could not be extracted for VM ID {vm_id}.")
    except Exception as e:
        print(f"Error during VM creation: {e}")
        return None
    finally:
        ssh.close()
        print("Disconnected from ESXi host.")

    
def unregister_vm(connect_to_exsi_ssh, vm_name):
    """Unregister a VM using vim-cmd over SSH."""
    ssh = connect_to_esxi_ssh()
    if ssh is None:
        print("Failed to establish an SSH connection to the ESXi host.")
        return None
    try:
        # Retrieve all VMs to find the VM ID
        command = "vim-cmd vmsvc/getallvms"
        stdin, stdout, stderr = ssh.exec_command(command)
        vm_list_output = stdout.read().decode()
        error = stderr.read().decode()

        if error:
            print(f"Error retrieving VM list: {error}")
            raise Exception(f"Error retrieving VM list: {error}")

        # Find the VM ID for the given VM name
        vm_id = None
        for line in vm_list_output.splitlines():
            if vm_name in line:
                vm_id = line.split()[0]  # The first column is the VM ID
                break

        if not vm_id:
            raise Exception(f"VM '{vm_name}' not found.")

        print(f"VM ID for '{vm_name}' is {vm_id}. Proceeding with unregistration.")

        # Unregister the VM using its ID
        command = f"vim-cmd vmsvc/unregister {vm_id}"
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()

        if error:
            print(f"Error unregistering VM: {error}")
            raise Exception(f"Error unregistering VM: {error}")

        print(f"VM '{vm_name}' successfully unregistered. Output: {output}")
        conn = sqlite3.connect('cluster_1.db')
        cursor = conn.cursor()
        cursor.execute("""
                            UPDATE ips_db
                            SET status = 'NO_VM', vm_name = None
                            WHERE vm_name = ?
                            """, (vm_name))
        conn.commit()
        conn.close()
        

        return True  # Indicate success
    except Exception as e:
        print(f"Error during VM unregistration: {e}")
        return False  # Indicate failure

@app.post("/scale_node/{cluster_name}")
def scale_node(cluster_name: str):

    conn = sqlite3.connect('cluster_1.db')
    cursor = conn.cursor()

    # Fetch IP Assigned VM_Name data from db
    cursor.execute("SELECT * FROM ips_db")
    ips_db = cursor.fetchall()

    # Fetch Folder_name new_name register data from db
    cursor.execute("SELECT * FROM get_vm_name")
    extra_node_hide = cursor.fetchall()

    # Fetch registered node data from db
    cursor.execute("SELECT * FROM registered_node")
    registered_node = cursor.fetchall()
    print(cluster_name)
    cursor.execute("SELECT ip, username, password, port FROM clusters WHERE name = ?", (cluster_name,))
    cluster_details = cursor.fetchone()

    target_ip_master, username_master, password_master, port_master = cluster_details
    
    flag = 1
    # Traverse the data storage to find the tuple with assigned_to as None (NULL)
    ## Update this for loop based on the format reterived from DB
    for record in registered_node:
        VM_name, IP, hostname, state , assigned_to = record

        if assigned_to is None:
            # Call the add_node function and return the hostname
            flag = 0
            if state == "on":
                target_ip_worker = IP
                username_worker = "test"
                password_worker="test"
                port_worker="22"
                hostname1 = add_node(
                    target_ip_master, username_master, password_master, port_master,
                    target_ip_worker, username_worker, password_worker, port_worker
                )
                # hostname1 = "power on"
                ## Here update the registered_node record for None to cluster IP 
                cursor.execute("""
                UPDATE registered_node
                SET cluster_ip = ?
                WHERE vm_name = ? AND cluster_ip IS NULL
                """, (target_ip_master, VM_name))

                # Commit the changes and close the connection
                conn.commit()
                break
                # conn.close()

            elif state == "off":
                print("running for off state")
                power_on_vm_ssh(connect_to_esxi_ssh,VM_name)
                time.sleep(60)
                target_ip_worker = IP 
                remote_ip = "10.200.16.17"  # Replace with remote server IP
                remote_user = "project"  # Replace with remote server username
                remote_password = "project"  # Replace with remote server password
                remote_port = 22  # Replace with the remote server SSH port

                try:
                    ssh = paramiko.SSHClient()
                    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                    ssh.connect(remote_ip, username=remote_user, password=remote_password, port=remote_port)

                    print(f"Connected to Ansible server at {remote_ip}.") # The new IP to assign to the VM
                    print(f"targetr ip worker : {target_ip_worker}")
                    playbook_path = "/home/project/ans/plays/change_ip.yml"  # Update with the playbook path on the remote server
                    inventory_path = "/home/project/ans/plays/hosts"  # Update with the inventory file path
                    ansible_command = f"ansible-playbook {playbook_path} -i {inventory_path} --extra-vars 'new_ip={target_ip_worker}'"
                    print("next ansible command")
                    sudo_command = f"echo {remote_password} | sudo -S {ansible_command}"

                    stdin, stdout, stderr = ssh.exec_command(sudo_command)
                    playbook_output = stdout.read().decode()
                    playbook_error = stderr.read().decode()

                    if playbook_error:
                        print(f"Ansible playbook error: {playbook_error}")

                    print(f"Ansible playbook executed successfully: {playbook_output}")
                    # Update ip table
                    # update extra node
                except Exception as e:
                    print(f"Error during SSH or playbook execution: {e}")

                finally:
                    ssh.close()
                    print("Disconnected from the Ansible server.")
                
                username_worker = "test"
                password_worker="test"
                port_worker="22"
                hostname1 = add_node(target_ip_master, username_master, password_master, port_master,
                    target_ip_worker, username_worker, password_worker, port_worker)
                # hostname1 = "power off"
                ## Here update the registered_node record for None to cluster IP 
                cursor.execute("""
                UPDATE registered_node
                SET cluster_ip = ?, power_status = ?
                WHERE vm_name = ? AND cluster_ip IS NULL
                """, (target_ip_master, "on", VM_name))
                flag = 0
                # Commit the changes and close the connection
                conn.commit()
                break
                # conn.close()
        

    if flag == 1:
        for record in extra_node_hide:
            folder_name, new_name, status = record
            print (f"Folder_name:{folder_name}, New_name :{new_name}, status: {status}")
            if status == "unregistered":
                # Create and register a new VM
                New_VM_name = create_new_vm(connect_to_esxi_ssh, folder_name, new_name)
                print(f"new vm create: {New_VM_name}")
                # New_VM_name = "qwe"
                if New_VM_name:
                    ## Power on VM
                    power_on_vm_ssh(connect_to_esxi_ssh, New_VM_name)
                    time.sleep(60)
                    # if New_VM_name == "sushant_backup_1":
                    #     power_off_vm_ssh(connect_to_esxi_ssh, New_VM_name,True)
                    #     time.sleep(20)
                    #     power_on_vm_ssh(connect_to_esxi_ssh, New_VM_name)
                    #     time.sleep(20)
                    print("Continuing program flow")
                    # Assign an unallocated IP to the new VM
                    for ip_record in ips_db:
                        ip, assigned_status, vm_name = ip_record
                        if assigned_status is None:
                            print(f"IP: {ip}, Assigned Status: {assigned_status}, VM Name: {vm_name}")
                            remote_ip = "10.200.16.17"  # Replace with remote server IP
                            remote_user = "project"  # Replace with remote server username
                            remote_password = "project"  # Replace with remote server password
                            remote_port = 22  # Replace with the remote server SSH port

                            try:

                                ssh = paramiko.SSHClient()
                                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                                ssh.connect(remote_ip, username=remote_user, password=remote_password, port=remote_port)

                                print(f"Connected to Ansible server at {remote_ip}.")
                                new_ip = ip  # The new IP to assign to the VM
                                print(f"New ip : {new_ip}")
                                playbook_path = "/home/project/ans/plays/change_ip.yml"  # Update with the playbook path on the remote server
                                inventory_path = "/home/project/ans/plays/hosts"  # Update with the inventory file path
                                ansible_command = f"ansible-playbook {playbook_path} -i {inventory_path} --extra-vars 'new_ip={new_ip}'"

                                sudo_command = f"echo {remote_password} | sudo -S {ansible_command}"

                                stdin, stdout, stderr = ssh.exec_command(sudo_command)
                                playbook_output = stdout.read().decode()
                                playbook_error = stderr.read().decode()

                                if playbook_error:
                                    print(f"Ansible playbook error: {playbook_error}")
                                    raise Exception("Failed to execute the Ansible playbook on the remote server.")

                                print(f"Ansible playbook executed successfully: {playbook_output}")
                                # Update ip table
                                # update extra node
                            except Exception as e:
                                print(f"Error during SSH or playbook execution: {e}")

                            finally:
                                ssh.close()
                                print("Disconnected from the Ansible server.")


                            # # Add the new VM as a node to the cluster
                            hostname1 = add_node(
                                target_ip_master, username_master, password_master, port_master,
                                new_ip, "test", "test", "22"
                            )
                            
                            # hostname1 = "scale1"
                            cursor.execute("""
                            UPDATE ips_db
                            SET status = 'Assigned', vm_name = ?
                            WHERE ip_address = ?
                            """, (New_VM_name, ip))


                            # # Add the new VM into the registered_node table
                            cursor.execute("SELECT COUNT(*) FROM registered_node WHERE vm_name = ?", (New_VM_name,))
                            if cursor.fetchone()[0] == 0:
                                cursor.execute("""
                                    INSERT INTO registered_node (vm_name, ip_address, hostname, power_status, cluster_ip)
                                    VALUES (?, ?, ?, ?, ?)
                                """, (New_VM_name, new_ip, hostname1, "on", target_ip_master))
                            else:
                                print(f"VM name {New_VM_name} already exists in registered_node.")
                                # You can choose to update the existing record here if needed
                                cursor.execute("""
                                    UPDATE registered_node
                                    SET ip_address = ?, hostname = ?, power_status = ?, cluster_ip = ?
                                    WHERE vm_name = ?
                                """, (new_ip, hostname1, "on", target_ip_master, New_VM_name))

                            print(f"New name: {new_name}")
                            cursor.execute("""
                            UPDATE get_vm_name
                            SET status = 'registered'
                            WHERE new_name = ?
                            """, (new_name,))

                            # hostname1 = "test success"
                            # Commit the changes and close the connection
                            conn.commit()
                            

                            ## Update  extra_node_hide registered_node
                            # Update `ips_db` to mark the IP as assigned
                            #ips_db[ips_db.index(ip_record)] = (ip, "Assigned", New_VM_name)
                            break
                break
        
            
    conn.close()
    return {"hostname": hostname1}

@app.post("/remove_node/{cluster_name}/{worker_name}")
def remove_node(cluster_name: str, worker_name: str):
    conn = None
    ssh = None
    worker_ssh = None
    try:    
        print(f"cluster name = {cluster_name}, worker_name : {worker_name}")
        conn = sqlite3.connect('cluster_1.db')
        cursor = conn.cursor()
        
        # Fetch details from the clusters table
        cursor.execute("SELECT ip, username, password, port FROM clusters WHERE name = ?", (cluster_name,))
        cluster_details = cursor.fetchone()
        
        if cluster_details is None:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        cluster_ip, cluster_user, cluster_password, cluster_port = cluster_details
        print(f"Cluster detail {cluster_ip, cluster_user, cluster_password, cluster_port}")

        conn = sqlite3.connect('cluster_1.db')
        cursor = conn.cursor()

        # Check if worker exists in registered_node table
        cursor.execute("SELECT ip_address, vm_name FROM registered_node WHERE hostname = ?", (worker_name,))
        result = cursor.fetchone()

        if result:
            worker_ip, worker_vm_name = result

        print(f"worker detail: {worker_name,worker_ip}")

        if worker_ip is None:
            raise HTTPException(status_code=404, detail="Worker node not found")
    

            ## in mastre node
        reply = "in same cluster"
        print("logging into master node")
        ssh = paramiko.SSHClient()
        print("paramiko ")
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print("set missing host")
        ssh.connect(cluster_ip, username=cluster_user, password=cluster_password,port=cluster_port)
        print("logged into master node")
        # Execute kubectl cordon command to mark the node unschedulable

        print("running cordon")
        cordon_command = f"kubectl cordon {worker_name}"
        stdin, stdout, stderr = ssh.exec_command(cordon_command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        if error:
            raise Exception(f"Error executing cordon command: {error}")

        print("running drain")
        # Drain the worker node (ignore daemonsets)
        drain_command = f"kubectl drain {worker_name} --ignore-daemonsets --force"
        stdin, stdout, stderr = ssh.exec_command(drain_command)
        output = stdout.read().decode()
        error = stderr.read().decode()

        print("running delete")
            # Delete the node from the cluster
        delete_command = f"kubectl delete node {worker_name}"
        stdin, stdout, stderr = ssh.exec_command(delete_command)
        output = stdout.read().decode()
        error = stderr.read().decode()
        if error:
            raise Exception(f"Error executing delete command: {error}")
        ssh.close()
            ## for worker disconnect and shutdown
        if worker_vm_name != None:
            print(f"the worker details is {worker_ip} ")
            worker_ssh = paramiko.SSHClient()
            worker_ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            worker_ssh.connect(worker_ip, username="test", password="test",port="22")

            print("running reset -f command")
            reset_command = "kubeadm reset -f"
            sudo_reset_command = f"echo {"test"} | sudo -S {reset_command}"
            print(sudo_reset_command)
            stdin, stdout, stderr = worker_ssh.exec_command(sudo_reset_command)
            print(f"exectuted command in {worker_ip}")
            output = stdout.read().decode()
            error = stderr.read().decode()
            time.sleep(10)
            print(stdout)
            
            additional_reset_commands = [
                "sudo rm -rf /etc/kubernetes",
                "sudo rm -rf /var/lib/kubelet",
                "sudo rm -rf /var/lib/etcd",
                "sudo rm -rf /etc/cni",
                "sudo rm -rf /opt/cni",
                "sudo systemctl stop kubelet",
                "sudo systemctl disable kubelet"
            ]
            for cmd in additional_reset_commands:
                worker_ssh.exec_command(f"echo {'test'} | sudo -S {cmd}")

            worker_ssh.close()
            print("now powering off vm")
            power_off_vm_ssh(connect_to_esxi_ssh,worker_vm_name,False)

        else:
            reply = "not in same cluster"

        conn.close()
        return {"reply":reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
@app.post("/delete_deployment/{cluster_name}/{deployment_name}")
async def delete_deployment(cluster_name: str, deployment_name: str):
    try:
        # Connect to the database to get cluster details
        conn = sqlite3.connect('cluster_1.db')
        cursor = conn.cursor()


        # Fetch cluster connection details
        cursor.execute("SELECT ip, username, password, port FROM clusters WHERE name = ?", (cluster_name,))
        cluster_details = cursor.fetchone()
        
        if not cluster_details:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        target_ip_master, username_master, password_master, port_master = cluster_details
        
        # Establish SSH connection to the master node
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(target_ip_master, username=username_master, password=password_master, port=port_master)


        # Execute kubectl delete command
        delete_command = f"kubectl delete deployment {deployment_name}"
        stdin, stdout, stderr = ssh.exec_command(delete_command)
        output = stdout.read().decode()
        error = stderr.read().decode()


        if error:
            raise HTTPException(status_code=400, detail=f"Error deleting deployment: {error}")


        ssh.close()
        
        return {"message": f"Deployment {deployment_name} successfully deleted."}


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Initialize scheduler
scheduler = BackgroundScheduler()
scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

class ScalingToggle(BaseModel):
    enabled: bool

# Global state tracking
scaling_state = {}
scaling_nodes = {}

@app.post("/toggle_scaling/{cluster_name}")
def toggle_scaling(cluster_name: str, toggle: ScalingToggle):
    action = "enabling" if toggle.enabled else "disabling"
    print(f"{action} auto-scaling for cluster: {cluster_name}")
    
    if toggle.enabled:
        scheduler.add_job(
            check_and_scale_cluster,
            'interval',
            minutes=0.1,
            args=[cluster_name],
            id=f"scaling_{cluster_name}"
        )
        print(f"Added scheduled job for {cluster_name} (every 6 seconds)")
    else:
        try:
            scheduler.remove_job(f"scaling_{cluster_name}")
            print(f"Removed scheduled job for {cluster_name}")
        except JobLookupError:
            print(f"No existing job found for {cluster_name}")
    
    return {"message": f"Automatic scaling {'enabled' if toggle.enabled else 'disabled'}"}

def check_and_scale_cluster(cluster_name: str):
    print(f"\n=== Starting scaling check for {cluster_name} ===")
    
    try:
        # Get cluster credentials
        conn = sqlite3.connect('cluster_1.db')
        cursor = conn.cursor()
        cursor.execute("SELECT ip, username, password, port FROM clusters WHERE name = ?", (cluster_name,))
        cluster_details = cursor.fetchone()
        conn.close()
        
        if not cluster_details:
            print(f"Cluster {cluster_name} not found in database")
            return

        master_ip, master_user, master_pass, master_port = cluster_details
        print(f"Connecting to master node at {master_ip}:{master_port}")

        # SSH connection
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(master_ip, username=master_user, password=master_pass, port=master_port)
        
        # Get node roles
        print("Fetching node roles...")
        stdin, stdout, stderr = ssh.exec_command("kubectl get nodes -o json")
        nodes_info = json.loads(stdout.read().decode())
        control_plane_nodes = set()
        
        for node in nodes_info['items']:
            name = node['metadata']['name']
            roles = [label.replace('node-role.kubernetes.io/', '') 
                    for label in node['metadata']['labels'].keys()
                    if 'node-role.kubernetes.io/' in label]
            print(f"Node {name} has roles: {roles}")
            if 'control-plane' in roles:
                control_plane_nodes.add(name)
        
        print(f"Control plane nodes: {control_plane_nodes}")

        # Get node metrics
        print("\nFetching node metrics...")
        stdin, stdout, stderr = ssh.exec_command("kubectl top nodes")
        output = stdout.read().decode().strip()
        error = stderr.read().decode()
        
        if error:
            print(f"Error getting metrics: {error}")
            return

        print("\nNode Metrics:")
        worker_nodes = []
        for line in output.split('\n')[1:]:  # Skip header
            parts = line.split()
            if len(parts) < 5:
                continue
                
            name = parts[0]
            cpu = parts[2].rstrip('%')
            mem = parts[4].rstrip('%')

            # Skip control plane nodes
            if name in control_plane_nodes:
                print(f"Skipping control plane node: {name}")
                continue

            # Handle unknown metrics
            if cpu == "<unknown>" or mem == "<unknown>":
                print(f"Skipping {name} with unknown metrics (status: {parts[1]})")
                continue

            cpu = int(cpu)
            mem = int(mem)
            worker_nodes.append({'name': name, 'cpu': cpu, 'mem': mem})
            print(f"{name}: CPU {cpu}%, MEM {mem}%")

        # Initialize cluster state
        if cluster_name not in scaling_state:
            scaling_state[cluster_name] = {'scaled_up': False, 'scaled_down': False}
        if cluster_name not in scaling_nodes:
            scaling_nodes[cluster_name] = []

        # Check scaling conditions
        high_usage = any(node['cpu'] > 70 or node['mem'] > 70 for node in worker_nodes)
        low_usage = all(node['cpu'] < 30 and node['mem'] < 30 for node in worker_nodes)
        
        print(f"\nScaling analysis:")
        print(f"High usage threshold breached: {high_usage}")
        print(f"Low usage threshold met: {low_usage}")
        print(f"Current scaling state: {scaling_state[cluster_name]}")
        print(f"Scaled nodes: {scaling_nodes[cluster_name]}")

        # Scaling logic
        if high_usage and not scaling_state[cluster_name]['scaled_up']:
            print("Triggering scale up...")
            # try:
            #     response = requests.post(f"http://localhost:8000/scale_node/{cluster_name}")
            #     if response.ok:
            #         hostname = response.json().get('hostname')
            #         print(f"Successfully scaled up. New node: {hostname}")
            #         scaling_nodes[cluster_name].append(hostname)
            #         scaling_state[cluster_name]['scaled_up'] = True
            # except Exception as e:
            #     print(f"Scale up failed: {str(e)}")

        elif low_usage and scaling_nodes[cluster_name] and not scaling_state[cluster_name]['scaled_down']:
            hostname = scaling_nodes[cluster_name].pop()
            print(f"Triggering scale down for node: {hostname}")
            # try:
            #     requests.post(f"http://localhost:8000/remove_node/{cluster_name}/{hostname}")
            #     scaling_state[cluster_name]['scaled_down'] = True
            #     print(f"Successfully removed node: {hostname}")
            # except Exception as e:
            #     print(f"Scale down failed: {str(e)}")
            #     scaling_nodes[cluster_name].append(hostname)  # Re-add if failed

        # Reset states if conditions change
        if not high_usage:
            scaling_state[cluster_name]['scaled_up'] = False
        if not low_usage:
            scaling_state[cluster_name]['scaled_down'] = False

        ssh.close()
        print(f"=== Completed scaling check for {cluster_name} ===\n")

    except Exception as e:
        print(f"!!! Critical error in scaling check: {str(e)} !!!")



# Run the FastAPI application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)