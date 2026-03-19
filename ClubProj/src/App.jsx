import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  return (
    <>
      <section id="navbar" class="flex">
        <div class="contents">
          <div><h2 id="navobj" class="flex-1 ...">Clubhub</h2></div>
          <div><h2 id="navobj" class="flex-1 ...">Login</h2></div>
          <div><h2 id="navobj" class="flex-1 ...">Create Account</h2></div>
        </div>
      </section>
      <section>
        <div>
          <h1 id="heading">a better way to organize</h1>
        </div>
      </section>  
    </>
  )
}

export default App
