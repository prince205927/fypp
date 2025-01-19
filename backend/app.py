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
from datetime import datetime
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
jenkins_router = APIRouter()

DB_POOL_SIZE = 5
db_pool = queue.Queue(maxsize=DB_POOL_SIZE)



# Initialize the connection pool
def init_db_pool():
    for _ in range(DB_POOL_SIZE):
        conn = sqlite3.connect('cluster.db', timeout=30.0)
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
    conn = sqlite3.connect('cluster.db')
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
            conn = sqlite3.connect('cluster.db')
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
            conn = sqlite3.connect('cluster.db')
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


@app.get("/list_clusters")
async def list_clusters():
    try:
        conn = sqlite3.connect('cluster.db')
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




@app.post("/delete_image")
async def delete_image(request: Request):
    try:
        data = await request.json()
        cluster_name = data['cluster_name']
        image = data['image']

        # Get cluster credentials
        conn = sqlite3.connect('cluster.db')
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

@app.get("/get_cluster_metrics")
async def get_cluster_metrics(cluster_name: str, node_name: str):
    try:
        conn = sqlite3.connect('cluster.db')
        c = conn.cursor()

        # Fetch the latest 100 metrics for the specified node and cluster
        c.execute('''
            SELECT timestamp, cpu_percent, memory_percent
            FROM cluster_stats
            WHERE cluster_name = ? AND node_name = ?
            ORDER BY timestamp DESC
            LIMIT 100
        ''', (cluster_name, node_name))
        
        rows = c.fetchall()
        if not rows:
            return {"error": "No data found for the specified node and cluster."}
        
        # Reverse data for chronological order
        timestamps = [row[0] for row in rows][::-1]
        cpu_metrics = [row[1].replace('%', '') for row in rows][::-1]  # Stripping the '%' symbol
        memory_metrics = [row[2].replace('%', '') for row in rows][::-1]  # Stripping the '%' symbol
        
        conn.close()

        return {
            "timestamps": timestamps,
            "cpu_metrics": cpu_metrics,
            "memory_metrics": memory_metrics
        }

    except Exception as e:
        return {"error": str(e)}

@app.get("/cluster/{cluster_name}")
async def get_cluster_stats(request: Request, cluster_name: str):
    try:
        # Get cluster credentials for SSH connection
        conn = sqlite3.connect('cluster.db')
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
        stdin, stdout, stderr = ssh.exec_command("""
            kubectl get nodes -o custom-columns=NAME:.metadata.name,STATUS:.status.conditions[-1].type,ROLES:.metadata.labels.kubernetes\.io/role
        """)
        nodes_output = stdout.read().decode('utf-8').strip().split('\n')
        
        # Parse Nodes
        nodes = []
        for line in nodes_output[1:]:  # Skip header
            parts = line.split()
            if len(parts) >= 3:
                nodes.append({
                    'name': parts[0],
                    'status': parts[1],
                    'roles': parts[2]
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
                conn = sqlite3.connect('cluster.db')
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
                conn = sqlite3.connect('cluster.db')
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

@app.post("/add_cluster")
async def add_cluster(cluster: ClusterCredentials):
    global clusters
    try:
        conn = sqlite3.connect('cluster.db')
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
        conn = sqlite3.connect('cluster.db')
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
        conn = sqlite3.connect('cluster.db')
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
        conn = sqlite3.connect('cluster.db')
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
        conn = sqlite3.connect('cluster.db')
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
        conn = sqlite3.connect('cluster.db')
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

@app.get("/get_pod_metrics")
async def get_pod_metrics(pod: str):
    try:
        conn = sqlite3.connect('cluster.db')
        c = conn.cursor()
        c.execute("""
            SELECT timestamp, cpu_percent, memory_percent 
            FROM pod_stats 
            WHERE pod_name = ? 
            ORDER BY timestamp DESC 
            LIMIT 100
        """, (pod,))
        results = c.fetchall()
        conn.close()

        timestamps = [row[0] for row in results][::-1]
        cpu_metrics = [float(row[1]) for row in results][::-1]
        memory_metrics = [float(row[2]) for row in results][::-1]

        return {
            "timestamps": timestamps,
            "cpu_metrics": cpu_metrics,
            "memory_metrics": memory_metrics
        }
    except Exception as e:
        print(f"Error fetching pod metrics: {str(e)}")
        return {"error": "An error occurred while fetching pod metrics."}

def insert_pod_metrics(pod_name: str, timestamp: str, cpu_usage: str, memory_usage: str):
    try:
        conn = sqlite3.connect('cluster.db')
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
        conn = sqlite3.connect('cluster.db')
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
        conn = sqlite3.connect('cluster.db')
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)