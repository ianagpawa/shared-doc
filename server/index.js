const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const uuidv4 = require('uuid').v4;

const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;
server.listen(port, () => {
    console.log(`Websocket server is running on port ${port}`);
});

// Simple cache to maintain active connections
const clients = {},
// SImple cache to main active users
    users = {};

// Maintains current editor
let editorContent = null,
// Audit of user activity
    userActivity = [];


const eventTypes = {
    USER_EVENT: 'userevent',
    CONTENT_CHANGE: 'contentchange'
};

function broadcastMessage(json) {
    const data = JSON.stringify(json);
    // Sends message to all clients
    for(let userId in clients) {
        let client = clients[userId];
        if (client.readyState === WebSocket.OPEN) { client.send(data); }
    };
}

function handleMessage(message, userId) {
    const dataFromClient = JSON.parse(message.toString()),
        type = dataFromClient.type,
        json = { type };
    let data;
    switch(type) {
        // Updates user activity history
        case eventTypes.USER_EVENT:
            users[userId] = dataFromClient;
            userActivity.push(`${dataFromClient.username} joined to edit the shared document.`);
            data = { users, userActivity };
            break;
        // Updates content changes
        case eventTypes.CONTENT_CHANGE:
            editorContent = dataFromClient.content;
            data = { editorContent, userActivity };
            break;
        default:
            return;
    }
    json.data = data;
    broadcastMessage(json);
}

function handleDisconnect(userId) {
    console.log(`${userId} disconnected.`);
    const json = { type: eventTypes.USER_EVENT },
        username = users[userId]?.username || userId;
    // Adds event
    userActivity.push(`${username} left the document`);
    json.data = { users, userActivity }
    // Deletes unused
    delete clients[userId];
    delete users[userId];

    broadcastMessage(json);
}

wsServer.on('connection', (connection) => {
    // Unique identifier generated.
    const userId = uuidv4();
    console.log('Recieved a new connection');

    // Stores new connection.
    clients[userId] = connection;
    console.log(`${userId} connected.`);
    
    // Handles new messages
    connection.on('message', (message) => handleMessage(message, userId) );
    // Handles user disconnects
    connection.on('close', () => handleDisconnect(userId));
});
