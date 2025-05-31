import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { Resource } from 'sst/resource'

export const APIRoute = createAPIFileRoute('/api/groceries')({
  GET: async ({ request, params }) => {
    const url = Resource.MyApi.url
    console.log(url)
    return fetch(url).then(async res => 
    {
        console.log(res);
        return await res.json()
      })
  },
})
