import './style.css'
import { GameEngine } from '@game/GameEngine'
import { GameUI } from '@ui/GameUI'
import { StorageHelper } from '@utils/storage'
import { Analytics } from '@utils/analytics'

// Scramble Game - Main Entry Point
console.log('🎮 Initializing Scramble Game...')

// Initialize core systems
const analytics = new Analytics()
const _gameEngine = new GameEngine() // Placeholder for SCRAM-002
const gameUI = new GameUI()

// Setup initial UI
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="game-container">
    <header>
      <h1>🔤 Scramble</h1>
      <p>Anagram Word Game</p>
    </header>
    
    <main>
      <div class="game-status">
        <p>Project setup complete! 🚀</p>
        <p>Architecture structure established following vanilla TypeScript + Vite pattern.</p>
      </div>
      
      <div class="next-steps">
        <h3>Next Implementation Steps:</h3>
        <ul>
          <li>✅ SCRAM-001: Project Setup (Complete)</li>
          <li>🔄 SCRAM-016: Testing Infrastructure</li>
          <li>⏳ SCRAM-002: Game State Management</li>
          <li>⏳ SCRAM-003: Anagram Generation</li>
        </ul>
      </div>
    </main>
  </div>
`

// Test architecture components
analytics.track('app_initialized')
gameUI.render()

// Test storage functionality
StorageHelper.save('scramble_setup', {
  initialized: true,
  timestamp: new Date().toISOString(),
  version: '0.0.0'
})

console.log('✅ Scramble Game initialized successfully!')
console.log('📁 Project structure:', {
  game: 'Core game logic and state',
  api: 'Word validation and API clients', 
  ui: 'User interface components',
  data: 'Anagram sets and dictionary',
  utils: 'Storage, analytics, helpers'
})
