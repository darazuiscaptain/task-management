import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Login from './Login.tsx'
import Signup from './Signup.tsx'
import Join from './Join.tsx'
import './index.css'
import AccountBar from './AccountBar.tsx'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import GroupList from './GroupList.tsx'
import {Toast } from './Toast.tsx'


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Toast />
        <BrowserRouter>
            <AccountBar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/home" element={<App />} />
                <Route path="/" element={<div><h2>Welcome to Task Management System</h2><h3>Login or signup to continue</h3></div>} />
                <Route path="/join" element={<Join />} />
                <Route path="/group" element={<GroupList />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
)
