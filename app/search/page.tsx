import { SearchPolls } from "@/components/search-polls"

export default function SearchPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold gradient-text mb-8">Search Polls</h1>
      <SearchPolls />
    </div>
  )
}
