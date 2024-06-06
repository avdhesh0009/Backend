// require('dotenv').config()
// const express=require('express')
// const app=express()
// const port=4000

// app.get('/',(req,res)=>{
//     res.send('Hello world!');
// })

// app.get('/twitter',(req,res)=>{
//     res.send('hiteshdotcom')
// })

// app.get('/login',(req,res)=>{
//     res.send('<h1>please login at chai aur code</h1>')
// })

// app.listen(process.env.port,()=>{
//     console.log(`Example app listening on port ${port}`)
// })
import 'dotenv/config'
const express=require('express');
const app=express();

app.get('/',(req,res)=>{
    res.send('<h1>This is Home Page</h1>')
})
app.get('/twitter',(req,res)=>{
    res.send('Welcome to twitter page')
})
app.listen(process.env.port,()=>{
    console.log('server is running');
})