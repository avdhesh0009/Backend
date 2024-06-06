import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [jokes,setJokes]=useState([]);
  useEffect(()=>{
     axios.get('/api/jokes')
     .then((res)=>{
       setJokes(res.data);
     }).catch((error)=>{
      console.log(`Error:${error}`)
     })
  },[])
  return (
    <>
      <h1>Chai aur code</h1>
      {
        jokes.map((joke)=>(
          <div key={joke.id}>
            <p>{joke.title}</p>
            <p>{joke.content}</p>
          </div>
        ))
      }
    </>
  )
}

export default App
