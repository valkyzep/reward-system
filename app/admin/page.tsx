"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple authentication - you can change these credentials
    if (username === 'admin' && password === 'admin123') {
      // Store auth in session storage
      sessionStorage.setItem('adminAuth', 'true')
      router.push('/admin/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen bg-[#181c23] flex items-center justify-center px-4">
      <div className="bg-[#23272f] rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-yellow-400 text-center mb-6">Admin Login</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-yellow-100 text-sm font-semibold mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-yellow-100 text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-yellow-700 text-yellow-100 px-6 py-3 rounded-lg font-bold shadow hover:bg-yellow-600 transition"
          >
            Login
          </button>
        </form>
        
        <p className="text-gray-400 text-sm text-center mt-6">
          Default credentials: admin / admin123
        </p>
      </div>
    </div>
  )
}
