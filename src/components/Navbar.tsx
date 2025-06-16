"use client"

import { Button } from "@/components/ui/button"
import { Info, MessageCircle, Search, MapPin, Brain, Save, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function Navbar() {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = [
        {
            href: "/chat-demo",
            label: "Chat Demo",
            icon: MessageCircle,
            isActive: pathname === "/chat-demo"
        },
        {
            href: "/ask",
            label: "Ask",
            icon: Brain,
            isActive: pathname === "/ask"
        },
        {
            href: "/memory/save",
            label: "Save",
            icon: Save,
            isActive: pathname === "/memory/save"
        },
        {
            href: "/search",
            label: "Search",
            icon: Search,
            isActive: pathname === "/search"
        },
        {
            href: "/context",
            label: "Context",
            icon: MapPin,
            isActive: pathname === "/context"
        },
        {
            href: "/memory-info",
            label: "Settings",
            icon: Info,
            isActive: pathname === "/memory-info"
        }
    ]

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    return (
        <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center min-w-0">
                        <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
                            <img
                                src="/Redis_logo.png"
                                alt="Redis Logo"
                                width={60}
                                height={60}
                                className="object-contain sm:w-[80px] sm:h-[80px]"
                            />
                            <div className="flex flex-col min-w-0">
                                <img
                                    src="/logo.png"
                                    alt="Logo"
                                    width={70}
                                    height={55}
                                    className="object-contain sm:w-[90px] sm:h-[70px]"
                                />

                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden sm:flex items-center space-x-0">
                        {navItems.map((item) => {
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant={item.isActive ? "default" : "ghost"}
                                        className={cn(
                                            "flex items-center gap-2 bg-white",
                                            item.isActive && "text-red-600 hover:text-red-700 bg-white border-b-2 border-red-500 rounded-none hover:bg-white"
                                        )}
                                    >
                                        {item.label}
                                    </Button>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Mobile menu button */}
                    <div className="sm:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMobileMenu}
                            className="p-2"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navItems.map((item) => {
                                return (
                                    <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                                        <Button
                                            variant={item.isActive ? "default" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-3 bg-white",
                                                item.isActive && "text-red-600 hover:text-red-700 bg-white border-l-4 border-red-500 rounded-none hover:bg-white"
                                            )}
                                        >
                                            {item.label}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
