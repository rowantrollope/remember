import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import Link from "next/link"

export function Navbar() {
    return (
        <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <h1 className="text-2xl font-bold text-purple-600">Agent Memory Demo</h1>
                        </Link>
                    </div>
                    
                    {/* Navigation buttons */}
                    <div className="flex items-center space-x-4">
                        <Link href="/memory-info">
                            <Button variant="ghost" className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Memory Info
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
