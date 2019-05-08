const path = require('path')
const http = require('http')

const express = require('express')
const process = require('process')
const socketio = require('socket.io')
const Filter = require('bad-words')

const app = new express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

app.use(express.static(publicDirectoryPath))

let count = 0

io.on('connection', (socket) => {
    console.log('New Websocket connection..')


    socket.on('join', ({ username, room }, callback)=> {
        const {error, user} = addUser({id: socket.id, username, room})
        console.log('.....', user)

        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
        
        socket.emit('message', generateMessage('Admin', 'Welcome !'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined.`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed.')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message) )
        callback()
    })
    socket.on('sendLocation', (coords, callback) => {
        //console.log(`server positon: ${coords}`)
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback("..Acknowledged !")
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage(`User ${user.username} has left.`) )
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
    /*
    socket.on('message', () => {
        console.log('Welcome..')
        io.emit('Welcome !')
    })*/

    /*
    socket.emit('countUpdated', count)
    socket.on('increment', () => {
        count++
        //socket.emit('countUpdated', count)
        io.emit('countUpdated', count)
    })*/
})

server.listen(port, () => {
    console.log(`Server is listening on port ${port} !`)
})