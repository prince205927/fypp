import { createSlice } from '@reduxjs/toolkit'


const clusterSlice = createSlice({
  name: 'clusters',
  initialState: {
    selectedCluster: null,
    loading: false,
    error: null
  },
  reducers: {
    setSelectedCluster: (state, action) => {
      state.selectedCluster = action.payload
    },
    clearSelectedCluster: (state) => {
      state.selectedCluster = null
    }
  }
})


export const { 
  setSelectedCluster, 
  clearSelectedCluster 
} = clusterSlice.actions
export default clusterSlice.reducer