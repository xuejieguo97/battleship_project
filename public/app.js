document.addEventListener('DOMContentLoaded',() => {
    const userGrid = document.querySelector('.grid-user')
    const computerGrid = document.querySelector('.grid-computer')
    const displayGrid = document.querySelector('.grid-display')

    // shift + d selet all you want to change
    const ships = document.querySelectorAll(".ship")
    const destoryer = document.querySelector('.destroyer-container')
    const submarine = document.querySelector('.submarine-container')
    const cruiser = document.querySelector('.cruiser-container')
    const battleship = document.querySelector('.battleship-container')
    const carrier = document.querySelector('.carrier-container')
    const startButton = document.querySelector('#start');
    const rotateButton = document.querySelector('#rotate')
    const turnDisplay = document.querySelector('#whose-go')
    const infoDisplay = document.querySelector('#info')
    const setupButtons = document.getElementById('setup-buttons')
    

    const socket = io();

    const userSquares = []
    const computerSquares=[]
    let isHorizontal = true
    let isGameOver = false
    let currentPlayer = 'user'
    const width = 10

    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1


    const shipArray = [
        {
            name: 'destroyer',
            directions: [
                [0, 1],
                [0, width]
            ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0, width, width*2],
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0, width, width*2],
            ]
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0, width, width*2, width*3],
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3, 4],
                [0, width, width*2, width*3, width*4],
            ]
        }
    ]


    createBoard(userGrid, userSquares)
    createBoard(computerGrid, computerSquares)

    if(gameMode === 'singlePlayer'){
        startSinglePlayer()
    }else{
        startMultiPlayer()
    }
    // Single Player
    let start
    let millis
    function startSinglePlayer(){

        // Get your player number
        socket.on('player-number', num => {
            playerNum = parseInt(num)
            socket.emit('singlePlayer', playerNum)
        
        })

        generate(shipArray[0])
        generate(shipArray[1])
        generate(shipArray[2])
        generate(shipArray[3])       
        generate(shipArray[4])
        startButton.addEventListener('click', () => {
            start = Date.now()
            setupButtons.style.display = 'none'
            playGameSingle()
        })
    }

    // MultiPlayer
    function startMultiPlayer(){

        // Get your player number
        socket.on('player-number', num => {
            if(num === -1){
                infoDisplay.innerHTML = "Sorry, the server is full"
            }else{
                playerNum = parseInt(num)
                if(playerNum === 1) currentPlayer = "enemy"
                console.log(playerNum)
                // Get other player status
                socket.emit('check-players')
            }
        })

        // Check whether the other player is connected or disconnected
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`)
            PlayerConnectedOrDisconnected(num)
        })

        // On enemy ready
        socket.on('enemy-ready', num => {
            enemyReady = true
            playerReady(num)
            if(ready) {
                playGameMulti(socket)
                setupButtons.style.display = 'none'
            }
        })

        // Check player status
        socket.on('check-players', players => {
            players.forEach((p ,i) => {
                if(p.connected) PlayerConnectedOrDisconnected(i)
                if(p.ready){
                    playerReady(i)
                    if(i !== playerReady) enemyReady = true
                }
            })
        })

        // check time out
        socket.on('timeout', () => {
            infoDisplay.innerHTML = 'You have reached the 10 minutes time limit'
        })

        // Ready button click
        startButton.addEventListener('click', () => {
            if(allShipsPlaced) {
                start = Date.now()
                playGameMulti(socket)
            }
            else infoDisplay.innerHTML = 'Please place all ships.'
        })

        // Setup event listener fpr firing
        computerSquares.forEach(square => {
            square.addEventListener('click', () => {
                if(currentPlayer === 'user' && ready && enemyReady){
                    shotFired = square.dataset.id
                    socket.emit('fire', shotFired)
                }
            })
        })


        // On fire received
        socket.on('fire', id => {
            enemyGo(id)
            const square = userSquares[id]
            socket.emit('fire-reply', square.classList)
            playGameMulti(socket)
        })

        // On receiving fire reply
        socket.on('fire-reply', classList => {
            revealSquare(classList)
            playGameMulti(socket)
        })
        

        function PlayerConnectedOrDisconnected(num){
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected`).classList.toggle('active')
            if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
        }

    }

    //Create Board
    function createBoard(grid, squares){
        for(let i = 0; i < width * width; i++){
            const square = document.createElement('div')
            square.dataset.id = i
            grid.appendChild(square)
            squares.push(square)
        }
    }

    //draw the computer's ship in square locations
    function generate(ship){
        let randomDirection = Math.floor( Math.random() * ship.directions.length)
        let current = ship.directions[randomDirection]
        if(randomDirection === 0) direction = 1
        if(randomDirection === 1) direction = 10
        let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length) - ship.directions[0].length * direction)

        const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken') )
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0)
    
        if(!isTaken && !isAtLeftEdge && !isAtRightEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))
        else generate(ship)
    }



    // rotate the ships
    function rotate(){
        if(isHorizontal){
            destoryer.classList.toggle('destroyer-container-vertical')
            submarine.classList.toggle('submarine-container-vertical')
            cruiser.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')
            isHorizontal = false;
            console.log(isHorizontal)
            return 
        }
        else{

            destoryer.classList.toggle('destroyer-container-vertical')
            submarine.classList.toggle('submarine-container-vertical')
            cruiser.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')
            isHorizontal = true;
            console.log(isHorizontal)
            return
        }
    }

    rotateButton.addEventListener('click', rotate)

 
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedShipNameWithIndex 
    let draggedShip
    let draggedShipLength


    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        selectedShipNameWithIndex = e.target.id
        console.log(selectedShipNameWithIndex)
    }))

    function dragStart(e){
        draggedShip = this
        draggedShipLength = this.childNodes.length
    }

    function dragOver(e){
        e.preventDefault()

    }

    function dragEnter(e){
        e.preventDefault
    }

    function dragLeave(){
        // console.log('drog leave')

    }

    function dragDrop(){
        let shipNameWithLastId = draggedShip.lastChild.id
        let shipClass = shipNameWithLastId.slice(0, -2)
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
        
        let shipLastId = lastShipIndex  + parseInt(this.dataset.id)
        console.log(shipLastId)

        const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
            1, 11, 21, 31, 41, 51, 61, 71, 81, 91,
            2, 12, 22, 32, 42, 52, 62, 72, 82, 92,
            3, 13, 23, 33, 43, 53, 63, 73, 83, 93]
        let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)

        const notAllowedvertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90,
                                    89, 88, 87, 86, 85, 84, 83, 82, 81, 80,
                                    79, 78, 77, 76, 75, 74, 73, 72, 71, 70,
                                    69, 68, 67, 66, 64, 64, 63, 62, 61, 60,]
        let newNotAllowedvertical = notAllowedvertical.splice(0, 10 * lastShipIndex)

        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

        shipLastId = shipLastId - selectedShipIndex
        console.log(shipLastId)

        if(isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)){
            for(let i=0; i < draggedShipLength; i++){
                let directionClass
                if(i === 0) directionClass = 'start'
                if(i === draggedShipLength - 1) directionClass = 'end'
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass) 
            }
        }else if(!isHorizontal && !newNotAllowedvertical.includes(shipLastId)){
            for(let i = 0; i < draggedShipLength; i++){
                let directionClass
                if(i === 0) directionClass = 'start'
                if(i === draggedShipLength - 1) directionClass = 'end'
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', 'vertical', directionClass, shipClass)
            }
        }else{
            return
        }

        displayGrid.removeChild(draggedShip)
        if(!displayGrid.querySelector('.ship')) allShipsPlaced = true
        
    }

    function dragEnd(){
        console.log('dragend')
    }


    // Game Logic for Multiplayers
    function playGameMulti(socket){
        if(isGameOver) return
        if(!ready){
            socket.emit('player-ready')
            ready = true
            playerReady(playerNum)
        }
        if(currentPlayer === 'user'){
            turnDisplay.innerHTML = 'Your Go'
        }
        if(currentPlayer === 'enemy'){
            turnDisplay.innerHTML = "Enemy's Go"
        }
    }

    function playerReady(number){
        let player = `.p${parseInt(number) + 1}`
        document.querySelector(`${player} .ready`).classList.toggle('active')

    }

    //Game logic for single player
    function playGameSingle(){
        if(isGameOver) return
        if(currentPlayer === 'user'){
            turnDisplay.innerHTML = 'Your Go'
            computerSquares.forEach(square => square.addEventListener('click', function(e){
                shotFired = square.dataset.id
                revealSquare(square.classList)
            }))}
        else if(currentPlayer === 'enemy'){
            turnDisplay.innerHTML = "Enemy's Go"
            setTimeout(enemyGo, 1000)
        }
    }


    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;

    function revealSquare(classList){
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
        const obj = Object.values(classList)
        if(!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver){
            if(obj.includes('destroyer')) destroyerCount++;
            if(obj.includes('submarine')) submarineCount++;
            if(obj.includes('cruiser')) cruiserCount++;
            if(obj.includes('battleship')) battleshipCount++;
            if(obj.includes('carrier')) carrierCount++;
        }
        if(obj.includes('taken')){
            enemySquare.classList.add('boom')
        }else{
            enemySquare.classList.add('miss')
        }
        checkForWins()
        currentPlayer = 'enemy'
        if(gameMode === 'singlePlayer') playGameSingle()
        return
    }


    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;

    function enemyGo(square){
        if(gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length)
        if(!userSquares[square].classList.contains('boom')){
            const hit = userSquares[square].classList.contains('taken')
            userSquares[square].classList.add(hit ? 'boom' : 'miss')
            if(userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++;
            if(userSquares[square].classList.contains('submarine')) cpuSubmarineCount++;
            if(userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
            if(userSquares[square].classList.contains('battleship')) cpuBattleshipCount++;
            if(userSquares[square].classList.contains('carrier')) cpuCarrierCount++
        }
        checkForWins()
        currentPlayer = 'user'
        turnDisplay.innerHTML = 'Your Go'
        return
    }

    function checkForWins(){
        let enemy = 'computer'
        if(gameMode === 'multiPlayer') enemy = 'enemy'
        if(destroyerCount === 2){
            destroyerCount = 10
            infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`
        }
        if(submarineCount === 3){
            submarineCount = 10
            infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`
        }
        if(cruiserCount === 3){
            cruiserCount = 10
            infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser` 
        }
        if(battleshipCount=== 4){
            battleshipCount = 10
            infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`
        }
        if(carrierCount == 5){
            carrierCount = 10
            infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`
        }

        
        if(cpuDestroyerCount === 2){
            cpuDestroyerCount = 10
            infoDisplay.innerHTML = `${enemy} sunk your destroyer`
        }

        if(cpuSubmarineCount === 3){
            cpuSubmarineCount = 10
            infoDisplay.innerHTML = `${enemy} sunk your submarine`
        }
        if(cpuCruiserCount === 3){
            cpuCruiserCount = 10
            infoDisplay.innerHTML = `${enemy} sunk your cruiser`
        }
        if(cpuBattleshipCount === 4){
            cpuBattleshipCount = 10
            infoDisplay.innerHTML = `${enemy} sunk your battleship`
        }
        if(cpuCarrierCount == 5){
            cpuCarrierCount = 10
            infoDisplay.innerHTML = `${enemy} sunk your carrier`
        }

        if(destroyerCount + submarineCount + cruiserCount + battleshipCount+ carrierCount === 50){
            infoDisplay.innerHTML = 'YOU WIN'
            gameOver('win')
            
        }
        
        if(cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount+ cpuCarrierCount === 50 ){
            infoDisplay.innerHTML = `${enemy.toLocaleUpperCase} WINS`
            gameOver('lose')
        }
        return
    }

    const messageBox = document.querySelector('.hover_bkgr_fricc')
    const closeButton = document.querySelector('.popupCloseButton')
    const submitButton = document.getElementById('submit-btn')

    function gameOver(message){
        isGameOver = true
        startButton.removeEventListener('click', playGameSingle)
        millis = Date.now() - start
        if(message === 'win') showMessageBox(millis)
    }
    
    async function testFuntion(){
        const recordName = await document.getElementById('name').value
        socket.emit('game-over', {'mode': gameMode, 'name': recordName, 'time': millis})
        await hideMessageBox()
        window.location.href = '/leaderboard'
    }

    function hideMessageBox(){
        const recordName = document.getElementById('name').value
        console.log(recordName)
        messageBox.style.display = "none"
        socket.emit('game-over', {'mode': gameMode, 'name': recordName, 'time': millis})
                    .then(window.location.href = '/leaderboard')

    }

    function showMessageBox(){
        messageBox.style.display = "block"
    }

    function closeMessageBox(){
        messageBox.style.display = "none"
    }
    closeButton.addEventListener('click', closeMessageBox)
    submitButton.addEventListener('click', hideMessageBox)

})