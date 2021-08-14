const express = require('express')
const path = require('path')
const http = require('http')
const PORT=  process.env.PORT || 3000
const socketio = require('socket.io')
const { dirname } = require('path')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

// Start Server
server.listen(PORT, () => console.log(`Server running on the port ${PORT}`))

// Handle a socket connection request from web client
const connections = [null, null]

io.on('connection', socket => {
    // Find an available player number
    let playerIndex = -1;
    for(const i in connections){
        if(connections[i] === null){
            playerIndex = i
            break
        }
    }

    // Ignore player 3
    if(playerIndex === -1) return

    // Tell the connecting client what player number they are
    socket.emit('player-number', playerIndex)
    console.log(`Player ${playerIndex} has connected`)
    connections[playerIndex] = false

    // Tell everyone what player number just connected
    socket.broadcast.emit('player-connection', playerIndex)



    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        // Tell everyone waht player number just disconnected
        socket.broadcast.emit('player-connection', playerIndex)
    })

    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })

    // check player status
    socket.on('check-players', () => {
        const players = []
        for(const i in connections){
            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })


    // On fire received
    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex}`, id)

        // emit the move to the orher player
        socket.broadcast.emit('fire', id)
    })

    // On fire replied
    socket.on('fire-reply', square => {
        console.log(square)
        
        // 
        socket.broadcast.emit('fire-reply', square)
    })

    // Timeout connection
    setTimeout(() => {
        connections[playerIndex] = null;
        socket.emit('timeout')
        socket.disconnect()
    }, 600000) // 10 min limit

})


