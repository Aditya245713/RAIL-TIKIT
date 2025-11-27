import React, { useEffect, useState } from 'react'
import { useTransition } from '../contexts/TransitionContext'
import trainGif from '../assets/images/train.gif'
import './TransitionLoader.css'

function TransitionLoader() {
  const { isTransitioning, transitionMessage, endTransition } = useTransition()
  const [stage, setStage] = useState('enter')

  useEffect(() => {
    if (!isTransitioning) {
      setStage('enter')
      return
    }

    // Stage sequence: enter -> show -> ready-to-exit -> exit
    const timer1 = setTimeout(() => setStage('show'), 300)
    
    // Set minimum duration timer (2 seconds minimum to ensure smooth transition)
    const minDurationTimer = setTimeout(() => {
      if (stage !== 'exit') {
        setStage('ready-to-exit')
      }
    }, 2000)

    // Fallback timer to ensure transition doesn't hang indefinitely
    const fallbackTimer = setTimeout(() => {
      if (stage !== 'exit') {
        setStage('ready-to-exit')
      }
    }, 8000) // Maximum 8 seconds

    return () => {
      clearTimeout(timer1)
      clearTimeout(minDurationTimer)
      clearTimeout(fallbackTimer)
    }
  }, [isTransitioning, stage])

  // Handle completion after minimum duration
  useEffect(() => {
    if (stage === 'ready-to-exit') {
      const exitTimer = setTimeout(() => {
        setStage('exit')
        const completeTimer = setTimeout(() => {
          endTransition()
        }, 800) // Wait for exit animation
        
        return () => clearTimeout(completeTimer)
      }, 200)
      
      return () => clearTimeout(exitTimer)
    }
  }, [stage, endTransition])

  if (!isTransitioning) return null

  return (
    <div className={`transition-loader ${stage}`}>
      <div className="transition-content">
        <div className="train-animation">
          <img 
            src={trainGif} 
            alt="Train loading..." 
            className="train-gif"
            onError={(e) => {
              // Fallback if gif doesn't load
              e.target.style.display = 'none'
            }}
          />
        </div>
        <div className="transition-message">
          <h2>Please Wait...</h2>
          <div className="loading-dots">
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </div>
        </div>
      </div>
      <div className="transition-overlay"></div>
    </div>
  )
}

export default TransitionLoader
