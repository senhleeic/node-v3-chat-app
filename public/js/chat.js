//import { callbackify } from "util";

//import { IncomingMessage } from "http";

//
const socket = io()
// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $locationMessage = document.querySelector('#location-template')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Optinos
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild
    //getComputedSylte func provided by the browser
    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visiableHeight = $messages.offsetHeight
    // Height of message container
    const containerHeight = $messages.scrollHeight
    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visiableHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight //scroll to the bottom
    }
    //console.log('styles: ', newMessageStyles)
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username, 
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

const locationTemplate = document.querySelector('#location-template').innerHTML

socket.on('locationMessage', (message) => {
    console.log('...' + message)
    const html = Mustache.render(locationTemplate, {
        username: message.username, 
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users  
    })
    document.querySelector('#sidebar').innerHTML = html 
})

/*
socket.on('countUpdated', (count) => {
    console.log('Count has been updated !', count)
})
document.querySelector('#increment').addEventListener('click', () => {
    console.log('Button clicked')
    socket.emit('increment')
})*/
/*
document.querySelector('#message').addEventListener('click', () => {
    console.log('Button clicked')
    socket.emit('message')
})*/


$messageForm.addEventListener('submit', (e) =>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        //enable 
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) { return console.log("..", error)}
        console.log('Message delivered !')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (message) => {
            $sendLocationButton.removeAttribute('disabled')
            console.log(`Location shared ! ${message} `)
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {    
        console.log("Join error..", error)
        alert(error)
        location.href = "/"
    }
})