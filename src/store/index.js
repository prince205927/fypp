import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '../services/api'
import clusterReducer from '../features/clusters/clusterSlice'


export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    clusters: clusterReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware)
})