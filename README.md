# Zoom Project

## Overview

This project is a web-based application that replicates core functionalities of Zoom, allowing users to conduct video conferences and real-time chats.

## Features

- **Video Conferencing**: Host or join virtual meetings with multiple participants.
- **Real-time Chat**: Send and receive messages during meetings.
- **User Authentication**: Secure login and registration system.
- **Responsive Design**: Accessible on various devices and screen sizes.

## Technologies Used

### Backend

- **Node.js**: JavaScript runtime for server-side development.
- **Express.js**: Web application framework for Node.js.
- **Mongoose**: ODM library for MongoDB, facilitating data modeling.
- **MongoDB**: NoSQL database for storing user and meeting data.
- **Socket.IO**: Enables real-time, bidirectional communication between clients and servers.

### Frontend

- **React.js**: Library for building user interfaces.
- **Material-UI**: React components for faster and easier web development.
- **CSS**: Styling and layout of the application.
- **Socket.IO-Client**: Library for connecting to the server using WebSockets.

## Usage of Socket.IO

- **Socket.IO (Backend)**: Used to enable real-time communication between the server and connected clients. It manages events like joining a room, broadcasting messages, and notifying users in real-time.
- **Socket.IO-Client (Frontend)**: Establishes a connection to the server and listens for real-time events. It sends and receives messages, allowing users to interact in real-time during meetings or chats.

## Contact

For any questions or feedback, please contact [gautamSH20](https://github.com/gautamSH20).
