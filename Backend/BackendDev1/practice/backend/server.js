import express from "express"
const app=express();

const port=process.env.port || 3000

app.get('/',(req,res)=>{
    res.send('server is ready')
})
app.get('/api/jokes',(req,res)=>{
    const jokes=[
        {
            id:1,
            title:'first joke',
            content:'This is first joke'
        },
        {
            id:2,
            title:'second joke',
            content:'This is second joke'
        },
        {
            id:3,
            title:'third joke',
            content:'This is third joke'
        },
        {
            id:4,
            title:'fourth joke',
            content:'This is fourth joke'
        },
        {
            id:5,
            title:'fifth joke',
            content:'This is fifth joke'
        }
    ];
    res.send(jokes);
})
app.listen(port,()=>{
    console.log(`server is running at port ${port}`)
})