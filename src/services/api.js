import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://127.0.0.1:8000/',
    prepareHeaders: (headers) => {
      return headers
    }
  }),
  tagTypes: ['Clusters', 'ClusterStats', 'Pods'],
  endpoints: () => ({}),
})