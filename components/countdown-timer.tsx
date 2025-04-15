"use client"

import { useEffect, useState } from "react"
import { CircularProgressbar, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
import { motion } from "framer-motion"

interface CountdownTimerProps {
  endTime: Date
  onComplete?: () => void
  showDetails?: boolean
  size?: "sm" | "md" | "lg"
}

export function CountdownTimer({ endTime, onComplete, showDetails = true, size = "md" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    total: number
    hours: number
    minutes: number
    seconds: number
    percentage: number
  }>({
    total: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    percentage: 100,
  })
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = endTime.getTime() - now.getTime()

      if (difference <= 0) {
        setIsCompleted(true)
        if (onComplete && !isCompleted) {
          onComplete()
        }
        return {
          total: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 0,
        }
      }

      // Calculate maximum duration (24 hours in milliseconds)
      const maxDuration = 24 * 60 * 60 * 1000

      // Calculate percentage of time left (capped at 24 hours)
      const originalDuration = Math.min(endTime.getTime() - now.getTime() + difference, maxDuration)
      const percentage = (difference / originalDuration) * 100

      // Calculate time components
      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return {
        total: difference,
        hours,
        minutes,
        seconds,
        percentage,
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      const updatedTimeLeft = calculateTimeLeft()
      setTimeLeft(updatedTimeLeft)

      if (updatedTimeLeft.total <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onComplete, isCompleted])

  // Size configurations
  const sizeConfig = {
    sm: {
      width: 40,
      height: 40,
      fontSize: "text-xs",
      padding: "p-1",
    },
    md: {
      width: 60,
      height: 60,
      fontSize: "text-sm",
      padding: "p-2",
    },
    lg: {
      width: 80,
      height: 80,
      fontSize: "text-base",
      padding: "p-3",
    },
  }

  const { width, height, fontSize, padding } = sizeConfig[size]

  // Format time for display
  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Get color based on time left
  const getColor = () => {
    if (isCompleted) return "#6b7280" // gray-500
    if (timeLeft.percentage < 25) return "#ef4444" // red-500
    if (timeLeft.percentage < 50) return "#f97316" // orange-500
    return "#8b5cf6" // vibrant-purple
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div
        style={{ width, height }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <CircularProgressbar
          value={timeLeft.percentage}
          strokeWidth={10}
          styles={buildStyles({
            strokeLinecap: "round",
            pathColor: getColor(),
            trailColor: "rgba(0, 0, 0, 0.1)",
            pathTransition: "stroke-dashoffset 0.5s ease",
          })}
        />
      </motion.div>

      <div className={`flex flex-col ${padding}`}>
        {isCompleted ? (
          <span className={`font-medium ${fontSize} text-gray-500`}>Ended</span>
        ) : (
          <>
            <span className={`font-medium ${fontSize}`}>
              {formatTime(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
            </span>
            {showDetails && (
              <span className="text-xs text-muted-foreground">{timeLeft.hours > 0 ? "remaining" : "left"}</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
