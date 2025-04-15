"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export function AiFeatureCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="w-full"
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="relative overflow-hidden border-2 border-violet-200 shadow-lg">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-pink-50 opacity-50" />

        {/* Sparkle effects */}
        {isHovered && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-10 right-10 w-4 h-4 bg-violet-300 rounded-full"
              style={{ filter: "blur(2px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute bottom-20 left-10 w-3 h-3 bg-pink-300 rounded-full"
              style={{ filter: "blur(1px)" }}
            />
          </>
        )}

        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <CardTitle className="gradient-text text-xl">AI-Powered Poll Creation</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            Let artificial intelligence help you create engaging polls in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white/80 p-4 rounded-lg border border-violet-100">
              <p className="font-medium text-sm mb-2">Just enter a poll title like:</p>
              <p className="text-violet-800 font-medium">"Best weekend activities"</p>
              <div className="mt-3 flex items-center">
                <Sparkles className="h-4 w-4 text-violet-500 mr-2" />
                <p className="text-sm text-muted-foreground">AI generates the rest</p>
              </div>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mr-2"></div>
                <span>Complete questions</span>
              </li>
              <li className="flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mr-2"></div>
                <span>Relevant poll options</span>
              </li>
              <li className="flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mr-2"></div>
                <span>Engaging descriptions</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white">
            <Link href="/create" className="flex items-center justify-center">
              Try AI Poll Creation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
