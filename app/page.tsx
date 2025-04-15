"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PublicPollList } from "@/components/public-poll-list"
import { ChevronRight, Vote, Clock, Eye, ImageIcon, Search, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="relative flex flex-col items-center justify-center space-y-8 text-center mb-16">
        {/* Background pattern */}
        <div className="absolute inset-0 dot-pattern -z-10 opacity-50"></div>

        {/* Animated title */}
        <motion.h1
          className="text-5xl font-bold tracking-tight gradient-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          PollPulse
        </motion.h1>

        {/* Subtitle with highlight */}
        <motion.p
          className="text-xl text-muted-foreground max-w-[600px]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Create polls with images, set time limits, and collect votes from your audience.
          <span className="highlight ml-1">Keep votes secret until the timer ends.</span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-lg font-semibold text-lg px-8 py-6"
          >
            <Link href="/create">
              <Sparkles className="mr-2 h-5 w-5" />
              Create a Poll
            </Link>
          </Button>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 left-1/4 w-20 h-20 bg-violet-500/10 rounded-full blur-xl"></div>
        <div className="absolute -top-10 right-1/4 w-16 h-16 bg-pink-500/10 rounded-full blur-xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-16">
        <motion.div
          className="flex flex-col items-center text-center p-6 rounded-xl enhanced-card bg-gradient-to-br from-violet-50 to-transparent"
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
            <Vote className="h-6 w-6 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Simple Voting</h3>
          <p className="text-muted-foreground">Create polls with multiple options and collect votes easily</p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center text-center p-6 rounded-xl enhanced-card bg-gradient-to-br from-pink-50 to-transparent"
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-pink-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Time Limits</h3>
          <p className="text-muted-foreground">Set deadlines for voting to create urgency and engagement</p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center text-center p-6 rounded-xl enhanced-card bg-gradient-to-br from-indigo-50 to-transparent"
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
            <Eye className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Secret Voting</h3>
          <p className="text-muted-foreground">Hide results until the poll ends to prevent bias</p>
        </motion.div>

        <motion.div
          className="flex flex-col items-center text-center p-6 rounded-xl enhanced-card bg-gradient-to-br from-purple-50 to-transparent"
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <ImageIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Image Support</h3>
          <p className="text-muted-foreground">Add images to your polls to make them more engaging</p>
        </motion.div>
      </div>

      <div className="flex justify-center mb-16">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 shadow-sm"
          >
            <Link href="/search" className="flex items-center gap-2">
              <Search className="h-5 w-5 text-violet-500" />
              Search for Polls
            </Link>
          </Button>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-100/30 to-pink-100/30 rounded-2xl -z-10"></div>
        <div className="flex items-center justify-between mb-8 p-4">
          <h2 className="text-3xl font-bold gradient-text-alt">Active Public Polls</h2>
          <Link
            href="/create"
            className="text-violet-600 hover:text-pink-600 flex items-center text-sm font-medium transition-colors duration-300"
          >
            Create New <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="p-4">
          <PublicPollList />
        </div>
      </div>
    </div>
  )
}
