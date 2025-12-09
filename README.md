# Kipi
Demo: https://drive.google.com/file/d/1o2olgIW0KQK3CvCWWeqtchS3hPqKx9vg/view?usp=sharing

## Project Overview
A full-stack React + Node.js chat and social app with:
- Authentication via Firebase Auth.
- Relational data (users, friends, calendar) in MySQL.
- Real-time messaging and conversation history in Firestore via Socket.IO.
- Frontend routes for Auth, Profile, Search, Friends, Messages, Calendar, and Notifications.
- Backend routes for auth, conversation, friend, user, and protected

## Prerequisites
- Node.js 18+ and npm
- MySQL 8 (or compatible)
- Firebase project (for Auth) and Firestore (for chat)
- Git (optional, for cloning)
- A modern browser (Chrome, Edge, Firefox)

## 1. Clone and install
Clone the repository:
- git clone https://github.com/celinastha/Kipi <br>
cd <project-root>
- Kipi in this case
Install dependencies in 2 different terminals
- cd backend and npm install
- cd frontend and npm install

## 2. Environment variables
Create .env files in both backend and frontend. Values in <> must be replaced with your own.
- In .env of backend folder add:
```
PORT = 3000
FIREBASE_API_KEY = <your-firebase-api-key>
MYSQL_HOST = <your-mysql-host>   
MYSQL_USER =  <your-mysql-user>
MYSQL_PASSWORD = <your-mysql-password>
MYSQL_DB = <your-mysql-dbname>
FIREBASE_PROJECT_ID = <your-firebase-project-id>
```
In .env of frontend folder add:
```
GOOGLE_API_KEY = "AIzaSyBN-TexpYXjYglz6uLKJA6zJMKhlBn0BHM";
HOLIDAY_CAL_ID = "en.usa#holiday@group.v.calendar.google.com";
```

## 3. Database setup
MySQL (required for users/friends/calender)
- Start MySQL locally.
- Create the database and tables:
- Use your provided schema (example):
```
CREATE DATABASE IF NOT EXISTS kipi_app;
USE kipi_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  pfp TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,     
  receiver_id INT NOT NULL,      
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_friendship (requester_id, receiver_id),
  INDEX idx_requester (requester_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_status (status)
);

CREATE TABLE calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_creator (creator_id),
  INDEX idx_event_date (event_date)
);

CREATE TABLE calendar_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  shared_with INT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_share (event_id, shared_with),
  INDEX idx_shared_with (shared_with)
);
```


Firebase project and Firestore (required for chat)
- Create a Firebase project at console.firebase.google.com.
- Enable:
- Authentication (Email/Password or your chosen providers)
- Firestore (in Native mode)
- Generate a Service Account (Firebase Admin SDK):
- Go to Project Settings → Service Accounts → Generate new private key
- Use values for project settings from Firebase console in backend/.env
- Add service key .json as “FirebaseServiceAccountKey.json” in Firebase folder in backend
You must create your own MySQL DB and your own Firebase project for this app to run.

## 4. Compile and run
Backend (Node.js/Express)
- cd backend
- npm install (if not already)
- node server.js
- Starts the server on PORT (from .env 3000)
Frontend (Vite React App)
- cd frontend
- npm install (if not already)
- npm run dev
- Runs local host (5713 default)

## 5. Usage guide
Sign up and log in
- Use the Auth page to register via Firebase Auth (Email/Password).
- On first login, the backend links your Firebase UID (firebase_uid) with a row in MySQL users.
Search users
- Search page: browse all users, send friend requests.
- Friends page: accept/reject requests, manage accepted friends, and removals.
- Status buttons (FriendActions) are shown on /search and /friends.
Messages (real-time chat)
- Messages page:
- Left sidebar shows accepted friends and group list.
- Click a friend to start a DM (startDM → dmReady → joinRoom).
- Click “Add New Group” to create a group (createGroup → groupReady → joinRoom).
- Chat area supports optimistic send, deduplication, and auto-scroll.
- Message history loads from Firestore (conversations/<id>/messages).
