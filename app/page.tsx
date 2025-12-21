
"use client"
import Image from 'next/image'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

const PointsRangeSlider = dynamic(() => import('./PointsRangeSlider'), { ssr: false })

const basePath = '' // Removed basePath for local development with API routes

const ITEMS_PER_PAGE = 8

// Default points range (will be updated when rewards are loaded)
let MIN_POINTS = 50
let MAX_POINTS = 20000000

// Banner images for carousel
const bannerImages = [
  { src: '/Time2Claim.png', alt: 'Time2Claim banner' },
  { src: '/iphone17promax.png', alt: 'iPhone 17 Pro Max' },
  { src: '/bmw.png', alt: 'BMW M2 2025' },
]

export default function Home() {
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReward, setSelectedReward] = useState<null | any>(null)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [tierFilter, setTierFilter] = useState<string[]>([])
  const [pointsRange, setPointsRange] = useState<[number, number]>([MIN_POINTS, MAX_POINTS])
  const [sortOrder, setSortOrder] = useState<'high-low' | 'low-high'>('high-low')
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [claimId, setClaimId] = useState('')
  const [showClaimsChecker, setShowClaimsChecker] = useState(false)
  const [checkClaimId, setCheckClaimId] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [claimStatus, setClaimStatus] = useState<{status: string, color: string, message: string} | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string>('')
  const [categories, setCategories] = useState<any[]>([])
  const [tiers, setTiers] = useState<any[]>([])

  // Disable scroll when welcome modal is open
  useEffect(() => {
    if (showWelcomeModal) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [showWelcomeModal])

  // Fetch CSRF token
  useEffect(() => {
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => console.error('Failed to fetch CSRF token:', err))
  }, [])

  // Preload tier background images
  useEffect(() => {
    const tiers = ['diamond', 'black-diamond', 'platinum'];
    tiers.forEach(tier => {
      const img = new window.Image();
      img.src = `/${tier}.png`;
    });
  }, []);

  // Fetch rewards from database
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch('/api/rewards')
        const data = await response.json()
        setRewards(data)
        
        // Update points range based on fetched rewards
        if (data.length > 0) {
          const points = data.map((r: any) => r.points)
          MIN_POINTS = Math.min(...points)
          MAX_POINTS = Math.max(Math.max(...points), 20000000)
          setPointsRange([MIN_POINTS, MAX_POINTS])
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching rewards:', error)
        setLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories')
        const data = await response.json()
        if (Array.isArray(data)) {
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    const fetchTiers = async () => {
      try {
        const response = await fetch('/api/admin/tiers')
        const data = await response.json()
        if (Array.isArray(data)) {
          setTiers(data)
        }
      } catch (error) {
        console.error('Error fetching tiers:', error)
      }
    }

    fetchRewards()
    fetchCategories()
    fetchTiers()
  }, [])

  // Memoize filtered carousel rewards (diamond and black-diamond only)
  const carouselRewards = useMemo(() => {
    if (!Array.isArray(rewards)) return [];
    return rewards
      .filter((item: any) => {
        const tier = item.tier || getTier(item.points, item.name, item.tier);
        return tier === 'diamond' || tier === 'black-diamond' || tier === 'platinum';
      })
      .slice(0, 10);
  }, [rewards]);

  // Auto-advance carousel every 5 seconds (right to left movement)
  useEffect(() => {
    if (carouselRewards.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev - 1 + carouselRewards.length) % carouselRewards.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [carouselRewards.length])

  // Reset gallery image and variant when popup opens
  useEffect(() => {
    if (selectedReward) {
      setSelectedGalleryImage(0)
      const firstVariant = (selectedReward as any).variants?.options?.[0] || ''
      setSelectedVariant(firstVariant)
    }
  }, [selectedReward])

  // Tier system - prioritizes database tier, falls back to points-based calculation
  const getTier = (points: number, itemName: string, dbTier?: string) => {
    // Use tier from database if available
    if (dbTier) {
      return dbTier
    }
    
    // Fallback: Calculate tier based on points and item name
    // Black Diamond: Luxury Cars (BMW, Mercedes, etc.) - 200k+ points
    if (points >= 200000 || itemName.toLowerCase().includes('bmw') || itemName.toLowerCase().includes('mercedes') || itemName.toLowerCase().includes('porsche') || itemName.toLowerCase().includes('ferrari')) {
      return 'black-diamond'
    }
    // Diamond: Rolex, high-end watches - 75k-200k points
    if (points >= 75000 || itemName.toLowerCase().includes('rolex') || itemName.toLowerCase().includes('watch')) {
      return 'diamond'
    }
    // Gold: iPhone, MacBook - 25k-75k points
    if (points >= 25000 || itemName.toLowerCase().includes('iphone') || itemName.toLowerCase().includes('macbook')) {
      return 'gold'
    }
    // Silver: Mid-range gadgets, GCash - 500-25k points
    if (points >= 500) {
      return 'silver'
    }
    // Bronze: Smaller prizes - under 500 points
    return 'bronze'
  }

  const sortedRewards = useMemo(() => {
    let filtered = [...rewards]
    
    // Filter by search query (automatic, searches name and category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((r: any) => 
        r.name.toLowerCase().includes(query) || 
        r.category.toLowerCase().includes(query)
      )
    }
    
    // Filter by category (additive - if any selected, filter to those)
    if (categoryFilter.length > 0) {
      filtered = filtered.filter((r: any) => categoryFilter.includes(r.category))
    }
    
    // Filter by points range
    filtered = filtered.filter((r: any) => r.points >= pointsRange[0] && r.points <= pointsRange[1])
    
    // Filter by tier (additive - if any selected, filter to those)
    if (tierFilter.length > 0) {
      filtered = filtered.filter((r: any) => {
        const itemTier = r.tier || getTier(r.points, r.name)
        return tierFilter.includes(itemTier)
      })
    }
    
    // Filter out out-of-stock items
    filtered = filtered.filter((r: any) => (r.quantity || 0) > 0)
    
    // Custom sort order based on stock and tier
    const tierOrder: Record<string, number> = {
      'black-diamond': 1,
      'diamond': 2,
      'platinum': 3,
      'gold': 4,
      'silver': 5,
      'bronze': 6
    }
    
    return filtered.sort((a, b) => {
      const aQuantity = a.quantity || 0
      const bQuantity = b.quantity || 0
      const aTier = a.tier || getTier(a.points, a.name)
      const bTier = b.tier || getTier(b.points, b.name)
      const aTierOrder = tierOrder[aTier] || 999
      const bTierOrder = tierOrder[bTier] || 999
      
      // Priority 1: Only 1 left (sorted by tier)
      const aIsOne = aQuantity === 1
      const bIsOne = bQuantity === 1
      if (aIsOne && !bIsOne) return -1
      if (!aIsOne && bIsOne) return 1
      if (aIsOne && bIsOne) return aTierOrder - bTierOrder
      
      // Priority 2: Less than 10 stocks (sorted by tier)
      const aIsLowStock = aQuantity < 10
      const bIsLowStock = bQuantity < 10
      if (aIsLowStock && !bIsLowStock) return -1
      if (!aIsLowStock && bIsLowStock) return 1
      if (aIsLowStock && bIsLowStock) return aTierOrder - bTierOrder
      
      // Priority 3: Sort by tier order (black-diamond → bronze)
      if (aTierOrder !== bTierOrder) return aTierOrder - bTierOrder
      
      // Priority 4: If same tier, sort by points (high to low)
      if (sortOrder === 'high-low') return b.points - a.points
      if (sortOrder === 'low-high') return a.points - b.points
      
      return 0
    })
  }, [rewards, searchQuery, categoryFilter, tierFilter, pointsRange, sortOrder])

  const getTierStyles = useMemo(() => (tier: string) => {
    switch (tier) {
      case 'black-diamond':
        return {
          borderColor: '#8b5cf6',
          animation: 'blackDiamondGlow 2s ease-in-out infinite',
          className: 'tier-black-diamond',
          textColor: 'text-purple-300',
          pointsColor: 'text-purple-400',
          buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
          buttonColor: '#8b5cf6',
          buttonBorderColor: '#c084fc',
          tierLabel: 'BLACK DIAMOND',
          tierLabelBg: 'bg-gradient-to-r from-purple-900 to-black',
          bannerColor: '#8b5cf6',
          bannerGlow: '0 0 20px rgba(139, 92, 246, 0.7), 0 0 40px rgba(139, 92, 246, 0.4)'
        }
      case 'diamond':
        return {
          borderColor: '#6366f1',
          animation: 'diamondSparkle 2s ease-in-out infinite',
          className: 'tier-diamond',
          textColor: 'text-gray-800',
          pointsColor: 'text-purple-600',
          buttonBg: 'bg-gray-800 hover:bg-gray-900 text-white',
          buttonColor: '#6366f1',
          buttonBorderColor: '#818cf8',
          tierLabel: '💠 DIAMOND',
          tierLabelBg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
          bannerColor: '#6366f1',
          bannerGlow: '0 0 20px rgba(99, 102, 241, 0.7), 0 0 40px rgba(99, 102, 241, 0.4)'
        }
      case 'platinum':
        return {
          borderColor: '#06b6d4',
          animation: 'platinumGlow 2s ease-in-out infinite',
          className: 'tier-platinum',
          textColor: 'text-cyan-100',
          pointsColor: 'text-cyan-300',
          buttonBg: 'bg-cyan-600 hover:bg-cyan-700 text-white',
          buttonColor: '#06b6d4',
          buttonBorderColor: '#22d3ee',
          tierLabel: '🏆 PLATINUM',
          tierLabelBg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
          bannerColor: '#06b6d4',
          bannerGlow: '0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(6, 182, 212, 0.5)'
        }
      case 'gold':
        return {
          borderColor: '#ffd700',
          animation: 'goldGlow 2s ease-in-out infinite',
          className: 'tier-gold',
          textColor: 'text-yellow-900',
          pointsColor: 'text-yellow-800',
          buttonBg: 'bg-black hover:bg-gray-800 text-yellow-400',
          buttonColor: '#ffd700',
          buttonBorderColor: '#fde047',
          tierLabel: 'GOLD',
          tierLabelBg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          bannerColor: '#ffd700',
          bannerGlow: '0 0 20px rgba(255, 215, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.4)'
        }
      case 'silver':
        return {
          borderColor: '#a8a8a8',
          animation: 'silverShine 3s ease-in-out infinite',
          className: 'tier-silver',
          textColor: 'text-gray-800',
          pointsColor: 'text-gray-700',
          buttonBg: 'bg-gray-700 hover:bg-gray-800 text-white',
          buttonColor: '#9ca3af',
          buttonBorderColor: '#d1d5db',
          tierLabel: 'SILVER',
          tierLabelBg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          bannerColor: '#9ca3af',
          bannerGlow: '0 0 20px rgba(156, 163, 175, 0.8), 0 0 40px rgba(156, 163, 175, 0.5)'
        }
      default: // bronze
        return {
          borderColor: '#cd7f32',
          animation: 'bronzeMatte 3s ease-in-out infinite',
          className: 'tier-bronze',
          textColor: 'text-yellow-100',
          pointsColor: 'text-yellow-200',
          buttonBg: 'bg-yellow-900 hover:bg-yellow-800 text-yellow-100',
          buttonColor: '#cd7f32',
          buttonBorderColor: '#fb923c',
          tierLabel: 'BRONZE',
          tierLabelBg: 'bg-gradient-to-r from-amber-700 to-amber-800',
          bannerColor: '#cd7f32',
          bannerGlow: '0 0 20px rgba(205, 127, 50, 0.7), 0 0 40px rgba(205, 127, 50, 0.4)'
        }
    }
  }, [])

  // Reset to page 1 when filter changes
  const totalPages = Math.ceil(sortedRewards.length / ITEMS_PER_PAGE)
  const paginatedRewards = sortedRewards.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Toggle category filter
  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
    setCurrentPage(1)
  }

  // Toggle tier filter
  const toggleTierFilter = (tier: string) => {
    setTierFilter(prev => 
      prev.includes(tier) 
        ? prev.filter(t => t !== tier)
        : [...prev, tier]
    )
    setCurrentPage(1)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setCategoryFilter([])
    setTierFilter([])
    setPointsRange([MIN_POINTS, MAX_POINTS])
    setCurrentPage(1)
  }

  // Count active filters
  const activeFilterCount = categoryFilter.length + tierFilter.length + 
    (pointsRange[0] !== MIN_POINTS || pointsRange[1] !== MAX_POINTS ? 1 : 0)

  if (typeof window !== 'undefined') {
    (window as any).popupDebug = () => setSelectedReward(rewards[0])
  }

  
  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col overflow-visible">
      {/* Welcome Modal - Full Page */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] w-screen h-screen bg-black welcome-modal-bg"
          >

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="welcome-modal-container absolute lg:relative bottom-0 lg:bottom-auto z-10 h-[55%] lg:h-full w-full lg:w-3/5 flex flex-col items-center lg:items-start justify-end lg:justify-center p-6 pb-12 lg:p-15 lg:pl-[100px] font-poppins"
              style={{ fontFamily: 'Poppins, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo/Image */}
              <div className="mb-4 lg:mb-8 w-full flex flex-col items-center lg:items-start welcome-modal-content">
                <img 
                  src="/Time2Claim.png" 
                  alt="Welcome" 
                  className="h-auto drop-shadow-2xl mb-4"
                  style={{ width: 'clamp(200px, 60vw, 600px)' }}
                />
                {/* Title */}
                <h1 className="w-full font-extrabold mb-2 text-white drop-shadow-lg text-center lg:text-left tracking-tight" style={{ fontSize: 'clamp(1.5rem, 5vw, 3.75rem)', lineHeight: '1.2' }}>
                  Unlock Exclusive Rewards
                </h1>
                {/* Description */}
                <p className="text-white mb-3 max-w-3xl text-center lg:text-left drop-shadow-lg font-medium" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)' }}>
                  Time2Claim is the official redemption platform for Time2Bet.
                </p>
                <p className="text-white mb-5 max-w-3xl text-center lg:text-left drop-shadow-lg font-medium" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)' }}>
                  Convert your earned points into exclusive rewards <br className="lg:hidden" />
                  <br className="hidden lg:block" />
                  and enjoy a seamless claiming experience.
                </p>
                
                {/* Button and Stats Container - Flexed for mobile */}
                <div className="w-full flex flex-col items-center lg:items-start" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
                {/* CTA Button */}
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="font-semibold rounded-xl text-white transition-all transform hover:scale-105 welcome-modal-btn"
                  style={{ 
                    padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 2rem)',
                    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                    background: 'linear-gradient(180deg, #F0FF00 0%, #FF7800 100%)', 
                    boxShadow: '0 10px 30px rgba(255, 120, 0, 0.3)'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.boxShadow = '0 0 20px #FF7800, 0 0 40px #FF7800, 0 10px 30px rgba(255, 120, 0, 0.5)'; 
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 120, 0, 0.3)'; 
                  }}
                >
                  CLAIM NOW
                </button>
                
                {/* Mobile stats - under button, centered, horizontal */}
                <div className="lg:hidden flex flex-row items-center justify-center w-full" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                  <div className="bg-transparent text-white shadow-lg  stats-container" style={{ padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 2.5vw, 1rem)' }}>
                    <div className="font-bold mb-1 welcome-modal-stats-number" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>55</div>
                    <div className="font-semibold text-white welcome-modal-stats-label" style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}>Rewards<br/>Claimed</div>
                  </div>
                  <div className="bg-transparent text-white shadow-lg  stats-container" style={{ padding: 'clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 2.5vw, 1rem)' }}>
                    <div className="font-bold mb-1 welcome-modal-stats-number" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>23K</div>
                    <div className="font-semibold text-white welcome-modal-stats-label" style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}>Active<br/>Players</div>
                  </div>
                </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom-left corner stats for desktop only */}
            <div className="hidden lg:flex fixed bottom-8 left-[100px] z-[10000] flex-row gap-4 items-center">
              <div className="bg-black/70 rounded-xl px-5 py-3 text-white shadow-lg border-l-4 border-orange-500">
                <div className="text-2xl font-bold mb-1">55</div>
                <div className="text-sm font-semibold text-orange-300">Rewards Claimed</div>
              </div>
              <div className="bg-black/70 rounded-xl px-5 py-3 text-white shadow-lg border-l-4 border-yellow-400">
                <div className="text-2xl font-bold mb-1">23K</div>
                <div className="text-sm font-semibold text-yellow-200">Active Players</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Only show homepage content when welcome modal is closed */}
      {!showWelcomeModal && (
        <>
      {/* Header */}
      <header className="w-full bg-gray-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <img src="/Time2Claim.png" alt="Time2Claim Logo" className="w-24 sm:w-[140px]" />
        </div>
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Claims Checker button */}
          <button 
            className="px-3 sm:px-4 py-2 text-white rounded-lg font-semibold text-sm transition border-2"
            style={{ background: 'linear-gradient(135deg, #FF7901 0%, #FFA323 100%)', borderColor: '#FFA323', boxShadow: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #E66D01 0%, #E69320 100%)'; e.currentTarget.style.boxShadow = '0 0 12px #FFA323, 0 0 24px #FFA323'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #FF7901 0%, #FFA323 100%)'; e.currentTarget.style.boxShadow = 'none'; }}
            onClick={() => setShowClaimsChecker(true)}
          >
            Track my Reward
          </button>
        </div>
      </header>
      {/* Banner Section */}
      <div className="w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 overflow-visible flex flex-col items-center relative pb-0">
        {/* Banner Image */}
        <div className="w-full relative">
          <div className="banner-container relative h-32 sm:h-48 md:h-64 overflow-hidden flex items-center justify-center">
            <img 
              src="/Bannertop.png" 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Divider with Glow - Positioned between banner and carousel */}
      <div className="w-full flex justify-center relative z-20" style={{ marginTop: '-2px', marginBottom: '-2px' }}>
        <div 
          className="divider-glow h-1 rounded-full"
          style={{
            width: '55%',
            backgroundColor: '#69E8F8',
            boxShadow: '0 0 10px #69E8F8, 0 0 20px #69E8F8, 0 0 30px #69E8F8'
          }}
        />
      </div>

      {/* Featured Rewards Carousel - Stacked Card Style */}
      <div className="carousel-wrapper w-full bg-gradient-to-b from-gray-800 to-gray-900 py-0 px-4 overflow-visible">
        <div className="carousel-container relative max-w-6xl mx-auto h-[500px] flex items-center justify-center">
          {carouselRewards.map((item: any, idx: number) => {
              const tier = item.tier || getTier(item.points, item.name, item.tier)
              const tierStyles = getTierStyles(tier)
              const availableStock = (item as any).available_stock ?? 999
              const isOutOfStock = availableStock === 0
              const isLastOne = availableStock === 1

              // Calculate position relative to center card
              const position = (idx - carouselIndex + carouselRewards.length) % carouselRewards.length
              const adjustedPos = position > carouselRewards.length / 2 ? position - carouselRewards.length : position

              // Calculate scale and position based on distance from center
              const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767
              const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1024
              
              // Mobile & Tablet: Only show 3 cards (-1, 0, 1), Desktop: Show 5 cards (-2, -1, 0, 1, 2)
              if (isMobile || isTablet) {
                if (adjustedPos < -1 || adjustedPos > 1) return null
              } else {
                if (adjustedPos < -2 || adjustedPos > 2) return null
              }
              
              let scale = 1
              let zIndex = 50
              let opacity = 1
              let translateX = 0

              if (adjustedPos === 0) {
                // Center card - large
                scale = isMobile ? 1.1 : (isTablet ? 1.05 : 1)
                zIndex = 50
                opacity = 1
                translateX = 0
              } else if (adjustedPos === -1 || adjustedPos === 1) {
                // Adjacent cards - medium
                scale = isMobile ? 0.95 : (isTablet ? 0.9 : 0.75)
                zIndex = 40
                opacity = 0.8
                translateX = adjustedPos * (isMobile ? 120 : (isTablet ? 260 : 280))
              } else if (adjustedPos === -2 || adjustedPos === 2) {
                // Outer cards - small (only for desktop)
                scale = 0.75
                zIndex = 30
                opacity = 0.5
                translateX = adjustedPos * 260
              }

              return (
                <motion.div
                key={item.id}
                className="carousel-card absolute"
                initial={{ 
                  scale,
                  opacity: 0,
                  x: translateX,
                  y: 0
                }}
                animate={{
                  scale,
                  x: translateX,
                  opacity,
                  zIndex,
                  y: 0
                }}
                transition={{
                  duration: 1.5,
                  ease: [0.16, 1, 0.3, 1]
                }}
                style={{ width: '300px', willChange: adjustedPos >= -1 && adjustedPos <= 1 ? 'transform, opacity' : 'auto' }}
              >
                <div className="relative group h-full">
                  {/* Stock Banners */}
                  {availableStock > 1 && availableStock <= 10 && (
                    <div className="carousel-stock-banner absolute top-0 -right-5 text-white text-center py-1 px-3 rounded-xl font-bold text-sm z-10 pointer-events-none select-none"
                      style={{ 
                        transform: 'rotate(20deg)',
                        backgroundColor: tierStyles.bannerColor,
                        boxShadow: tierStyles.bannerGlow
                      }}>
                      Only {availableStock} Left!
                    </div>
                  )}
                  
                  {isLastOne && (
                    <div className="carousel-stock-banner absolute top-0 -right-5 text-white text-center py-1 px-3 rounded-xl font-bold text-sm z-10 pointer-events-none select-none"
                      style={{ 
                        transform: 'rotate(20deg)',
                        backgroundColor: tierStyles.bannerColor,
                        boxShadow: tierStyles.bannerGlow
                      }}>
                      Last One!
                    </div>
                  )}
                  
                  {isOutOfStock && (
                    <div className="carousel-out-of-stock absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center z-50 select-none">
                      <div className="carousel-out-of-stock-text text-white font-extrabold text-2xl text-center">
                        OUT OF<br />STOCK
                      </div>
                    </div>
                  )}

                  <div className="transition-all duration-200 h-full" style={{aspectRatio: '1180/1756'}}>
                    <div 
                      className={`carousel-card-content relative flex flex-col items-center justify-end shadow-2xl transition-all duration-200 w-full h-full overflow-hidden ${tierStyles.className}`}
                      style={{
                        borderRadius: '42px',
                        backgroundImage: `url(/carouselcard.png)`,
                        backgroundSize: '100% 100%',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        ...(adjustedPos === 0 ? {
                          boxShadow: isMobile 
                            ? `0 0 10px ${tierStyles.borderColor}ee, 0 0 20px ${tierStyles.borderColor}88, 0 0 30px ${tierStyles.borderColor}44`
                            : `0 0 30px ${tierStyles.borderColor}ee, 0 0 60px ${tierStyles.borderColor}88, 0 0 90px ${tierStyles.borderColor}44`
                        } : {})
                      }}
                    >
                      {isLastOne && adjustedPos !== 0 && (
                        <div 
                          className="absolute inset-[-2px] border-2 rounded-[10px] pointer-events-none z-50"
                          style={{
                            borderColor: tierStyles.bannerColor,
                            boxShadow: tierStyles.bannerGlow,
                          }}
                        />
                      )}
                      
                      <div className="w-full flex-1 p-0 flex items-center justify-center overflow-hidden">
                        <img 
                          src={(item as any).image || `https://via.placeholder.com/300x200/333333/FFFFFF?text=${encodeURIComponent(item.name)}`}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      
                      <div className="carousel-bottom-section pl-4 pr-2 pb-4 w-full flex flex-col gap-1" style={{ height: '20%', fontFamily: 'Poppins'}}>
                        {/* Item name and points row */}
                        <div className="flex justify-between items-center w-full">
                          <span className="carousel-item-name font-bold text-white" style={{ fontSize: '26px', width: '50%', lineHeight: '26px'}}>{item.name}</span>
                          <div className="carousel-points-container flex flex-col items-end gap-1 justify-start" style={{ alignSelf: 'flex-start', width: '50%'}}>
                            <div className="carousel-points-wrapper flex pt-2 items-start gap-1">
                              <img src="/pts.png" alt="Points" className="carousel-points-icon" style={{ width: '15px', height: '15px', marginTop: '0px' }} />
                              <span className="carousel-points-text font-bold text-white p-0" style={{ fontSize: '15px', lineHeight: '17px' }}>{item.points.toLocaleString()} Pts</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Item model/description */}
                        <div className="carousel-item-model text-sm text-white">
                          {item.model || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      {/* Mobile filter button - After carousel */}
      <div className="mobile-filter-section w-full bg-gray-900 py-4 px-4 lg:hidden">
        <div className="mobile-filter-bar flex items-center justify-center gap-4 max-w-6xl mx-auto">
          <button 
            className="mobile-filters-button px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold text-sm"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <img src="/filter.png" alt="Filter" className="mobile-filter-icon inline-block mr-1" />
            Active Filters
          </button>
          
          <div className="mobile-slider-wrapper flex-1 max-w-xs">
            <PointsRangeSlider
              min={MIN_POINTS}
              max={MAX_POINTS}
              value={pointsRange}
              onChange={(val) => {
                setPointsRange(val)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden relative z-50">
          <div className="fixed inset-0 bg-transparent" onClick={() => setMobileFiltersOpen(false)} />
          <div className="mobile-filter-dropdown absolute left-0 right-0 mx-4 mt-2 bg-gray-800 rounded-lg p-4 shadow-2xl max-h-[70vh] overflow-y-auto">
            {/* Mobile Category Filter */}
            <div className="mobile-filter-section-wrapper mb-4">
              <h4 className="mobile-filter-heading text-xs font-semibold text-white tracking-wider mb-2">Category</h4>
              <div className="space-y-1">
                {categories.map(cat => (
                  <label key={cat.id} className={`mobile-filter-label flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg transition-all ${categoryFilter.includes(cat.name) ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-gray-700/50'}`}>
                    <input type="checkbox" checked={categoryFilter.includes(cat.name)} onChange={() => toggleCategoryFilter(cat.name)} className="mobile-filter-checkbox rounded text-yellow-500" />
                    <span className={`mobile-filter-text text-xs ${categoryFilter.includes(cat.name) ? 'text-yellow-400 font-medium' : 'text-gray-300'}`}>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Mobile Tier Filter */}
            <div className="mobile-filter-section-wrapper mb-4">
              <h4 className="mobile-filter-heading text-xs font-semibold text-white uppercase tracking-wider mb-2">Tier</h4>
              <div className="space-y-1">
                {tiers.map(tier => (
                  <label key={tier.id} className={`mobile-filter-label flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg transition-all ${tierFilter.includes(tier.id) ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-gray-700/50'}`}>
                    <input type="checkbox" checked={tierFilter.includes(tier.id)} onChange={() => toggleTierFilter(tier.id)} className="mobile-filter-checkbox rounded text-yellow-500" />
                    <span className={`mobile-filter-text text-xs ${tierFilter.includes(tier.id) ? 'text-yellow-400 font-medium' : 'text-gray-300'}`}>{tier.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 w-full overflow-visible">
        {/* Sidebar - Active Filters (Desktop) */}
        <aside className="filter-sidebar hidden md:flex flex-col w-72 bg-gray-800 rounded-xl mx-8 mt-4 p-6 shadow-lg h-fit self-start">
          {/* Points Range Slider - Best UX */}
          <div className="mb-6">
            <PointsRangeSlider
              min={MIN_POINTS}
              max={MAX_POINTS}
              value={pointsRange}
              onChange={(val) => {
                setPointsRange(val)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="mb-5">
            <h4 className="text-base font-semibold text-white tracking-wider mb-3">Category</h4>
            <div className="space-y-1">
              {categories.map(cat => (
                <label key={cat.id} className={`flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg transition-all ${categoryFilter.includes(cat.name) ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-gray-700/50'}`}>
                  <input
                    type="checkbox"
                    checked={categoryFilter.includes(cat.name)}
                    onChange={() => toggleCategoryFilter(cat.name)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className={`text-sm ${categoryFilter.includes(cat.name) ? 'text-yellow-400 font-medium' : 'text-gray-300'}`}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Prestige Tier Filter */}
          <div className="mb-4">
            <h4 className="text-base font-semibold text-white tracking-wider mb-3">Tier</h4>
            <div className="space-y-1">
              {tiers.map(tier => (
                <label key={tier.id} className={`flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg transition-all ${tierFilter.includes(tier.id) ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-gray-700/50'}`}>
                  <input
                    type="checkbox"
                    checked={tierFilter.includes(tier.id)}
                    onChange={() => toggleTierFilter(tier.id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className={`text-sm ${tierFilter.includes(tier.id) ? 'text-yellow-400 font-medium' : 'text-gray-300'}`}>
                    {tier.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <main className="main-content flex-1 flex flex-col items-center px-3 sm:px-4 md:px-8 py-4 overflow-visible">
          <div className="filter-search-container w-full flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center mb-4 sm:mb-6">
            <div className="search-container relative w-full sm:w-64 md:w-80 lg:w-[400px]">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search rewards..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-yellow-500 focus:shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:border-yellow-600 hover:shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-200 text-sm sm:text-base" 
              />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center w-full py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Loading rewards...</p>
              </div>
            </div>
          ) : (
          <div className="rewards-grid grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 w-full max-w-7xl px-1 overflow-visible pt-8">
          {paginatedRewards.map((item) => {
            const availableStock = item.quantity || 0
            const isLowStock = availableStock <= 10 && availableStock >= 2
            const isLastOne = availableStock === 1
            const isOutOfStock = availableStock === 0
            const tier = item.tier || getTier(item.points, item.name, item.tier)
            const tierStyles = getTierStyles(tier)
            
            return (
            <div key={item.id} className={`reward-card-wrapper relative hover:scale-105 transition-all duration-200 h-full group ${(isLowStock || isLastOne) ? 'z-10 hover:z-30' : 'z-0 hover:z-30'} ${isOutOfStock ? 'cursor-not-allowed' : ''}`} style={{ overflow: 'visible' }}>
              {/* Low Stock Banner (2-10 items) - Plain overlay */}
              {isLowStock && (
                      <div className="reward-card-stock-banner absolute top-2 right-2 text-white text-center py-1 px-3 rounded-xl font-bold text-xs shadow-lg z-10 group-hover:z-50 pointer-events-none select-none"
                      style={{ 
                        transform: 'rotate(0deg)',
                        background: 'linear-gradient(180deg, #f7b45a 0%, #f6801a 100%)',
                        boxShadow: "0 0 2px 2px #e5bd5d , 0 0 4px 3px #e5bd5d"
                      }}>
                        Only {availableStock} Left!
                      </div>
              )}
              
              {/* Last One Banner (1 item) - Animated overlay */}
              {isLastOne && (
                      <div className="reward-card-stock-banner absolute top-2 right-2 text-[#ffe84a] text-center py-1 px-3 rounded-xl font-bold text-xs z-10 group-hover:z-50 pointer-events-none select-none"
                      style={{ 
                        transform: 'rotate(0deg)',
                        background: 'linear-gradient(180deg, #ff1a1c 0%, #800505 100%)',
                        boxShadow: "0 0 3px 3px #e5bd5d"
                      }}>
                        Only 1 Left 🔥
                      </div>
              )}
              
              {/* Out of Stock Overlay (0 items) - Full card cover */}
              {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/70 rounded-[7px] flex items-center justify-center z-50 select-none">
                        <div className="text-white font-extrabold text-2xl text-center bg-[#ffffff33] rounded-full w-32 h-32 flex items-center justify-center">
                          OUT OF<br />STOCK
                        </div>
                      </div>
              )}
              
              <div className="transition-all duration-200 h-full" style={{aspectRatio: '1180/1756'}}>
              <div 
                className={`reward-card-content relative flex flex-col items-center justify-end transition-all duration-200 w-full h-full overflow-hidden ${tierStyles.className}`}
                style={{
                  borderRadius: '7px',
                  backgroundImage: `url(/${tier}.png)`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  ...(isLowStock || isLastOne ? {
                    boxShadow: tierStyles.bannerGlow,
                  } : {})
                }}
              >
                {/* Animated border and glow layer for last one */}
                {isLastOne && (
                  <div 
                    className="absolute inset-[-2px] border-2 rounded-[10px] animate-pulse pointer-events-none z-50"
                    style={{
                      borderColor: tierStyles.bannerColor,
                      boxShadow: tierStyles.bannerGlow,
                    }}
                  />
                )}
              {/* Image - 100% width & height */}
              <div className="reward-card-image-container w-full h-full rounded-t-xl px-3 pt-10 flex items-center justify-center overflow-hidden">
                <img 
                  src={(item as any).image || `https://via.placeholder.com/300x200/333333/FFFFFF?text=${encodeURIComponent(item.name)}`}
                  alt={item.name}
                  className="reward-card-image w-full h-full object-cover rounded-xl"
                />
              </div>
              
              <div className="reward-card-info px-8 pb-3 pt-1 w-full flex flex-col gap-0 items-center">
              {/* Brand Name - Left aligned */}
              <div className="reward-card-title font-extrabold text-lg text-left w-full text-white drop-shadow-lg" style={{ lineHeight: '25px' }}>{item.name}</div>
              <div className="reward-card-model font-normal text-xs text-left w-full text-white drop-shadow-lg" style={{ lineHeight: '10px' }}>{(item as any).model || 'N/A'}</div>
              
              {/* Points with token icon - Left aligned */}
              <div className="reward-card-points-container mb-0 pb-3 pt-4 text-left w-full flex items-center gap-1 font-medium text-white" >
                <img src="/pts.png" alt="Points" className="reward-card-points-icon w-4 h-4" />
                <span className="reward-card-points-text font-bold text-medium text-white" style={{ lineHeight: '20px' }}>{item.points.toLocaleString()}</span>
              </div>
              
              {/* Claim Button */}
              <motion.button
                type="button"
                className={`reward-card-button ${tierStyles.className} px-3 py-1.5 rounded-lg font-bold shadow transition mt-auto text-sm border-2 ${
                  isOutOfStock
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : ''
                }`}
                style={{
                  width: '70%',
                  borderColor: isOutOfStock ? 'rgba(255, 255, 255, 0.2)' : tierStyles.buttonBorderColor,
                  boxShadow: 'none',
                  ...(isOutOfStock ? {} : {
                    background: isLastOne 
                      ? `linear-gradient(180deg, ${tierStyles.bannerColor} 0%, ${tierStyles.bannerColor}aa 100%)`
                      : `linear-gradient(180deg, ${tierStyles.buttonColor} 0%, ${tierStyles.buttonColor}aa 100%)`,
                    color: 'white'
                  })
                }}
                onClick={() => !isOutOfStock && setSelectedReward(item)}
                disabled={isOutOfStock}
                whileHover={!isOutOfStock ? { scale: 1.05 } : {}}
                whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onMouseEnter={e => {
                  if (!isOutOfStock) {
                    e.currentTarget.style.boxShadow = `0 0 12px ${tierStyles.buttonBorderColor}, 0 0 24px ${tierStyles.buttonBorderColor}`;
                  }
                }}
                onMouseLeave={e => {
                  if (!isOutOfStock) {
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isOutOfStock ? 'OUT OF STOCK' : 'CLAIM NOW'}
              </motion.button>
              </div>
              </div>
              </div>
            </div>
            )
          })}
        </div>
          )}
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="pagination-container flex items-center justify-center gap-1.5 mt-6 sm:mt-8 mb-4 flex-wrap px-2" style={{ fontFamily: 'Poppins' }}>
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`pagination-button w-9 h-9 rounded-lg font-bold transition text-base flex items-center justify-center ${
                currentPage === 1 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <img src="/firstpage.png" alt="First" className="w-3 h-3" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`pagination-button w-9 h-9 rounded-lg font-bold transition text-base flex items-center justify-center ${
                currentPage === 1 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <img src="/prev.png" alt="Previous" className="w-2 h-3" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Show limited page numbers
              const showPage = totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
              if (!showPage) {
                if (page === 2 || page === totalPages - 1) return <span key={page} className="text-gray-500 px-1 text-xl">...</span>
                return null
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-button w-9 h-9 rounded-lg font-bold transition text-base ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            
            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`pagination-button w-9 h-9 rounded-lg font-bold transition text-base flex items-center justify-center ${
                currentPage === totalPages 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <img src="/next.png" alt="Next" className="w-2 h-3" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`pagination-button w-9 h-9 rounded-lg font-bold transition text-base flex items-center justify-center ${
                currentPage === totalPages 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <img src="/lastpage.png" alt="Last" className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Claims Checker Modal */}
        {showClaimsChecker && (
          <div className="claims-checker-backdrop fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-80 p-4 animate-fadeIn" onClick={() => {
            setShowClaimsChecker(false);
            setCheckClaimId('');
            setClaimStatus(null);
            setIsChecking(false);
          }}>
            <div className="claims-checker-modal shadow-2xl p-8 max-w-lg w-full animate-scaleIn relative overflow-hidden" style={{ 
              borderRadius: '20px',
              background: 'linear-gradient(#1F2937, #1F2937) padding-box, linear-gradient(135deg, #FF7901, #FFA323) border-box',
              border: '2px solid transparent'
            }} onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button 
                className="absolute -top-1 right-0 text-gray-400 hover:text-white text-3xl font-bold w-12 h-12 flex items-center justify-center"
                onClick={() => {
                  setShowClaimsChecker(false);
                  setCheckClaimId('');
                  setClaimStatus(null);
                  setIsChecking(false);
                }}
              >
                &times;
              </button>
              
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="claims-checker-title text-3xl font-extrabold mb-2" style={{ background: 'linear-gradient(135deg, #FF7901, #FFA323)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Track my Reward</h2>
                <p className="claims-checker-description text-gray-300 text-sm">Please enter your Request ID so you can see the status of your request</p>
              </div>
              
              {/* Input Field with Loading Animation */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={checkClaimId}
                    onChange={(e) => setCheckClaimId(e.target.value.toUpperCase())}
                    placeholder="Enter Request ID (e.g., CLM-XY7K4M9B2)"
                    className="claims-checker-input w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none transition"
                    // style removed: focusBorderColor is not a valid CSS property
                    onFocus={(e) => e.currentTarget.style.borderColor = '#FF7901'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#4B5563'}
                    disabled={isChecking}
                  />
                  {isChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-6 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF7901', borderTopColor: 'transparent' }}></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Check Claim Button */}
              <button
                onClick={async () => {
                  if (!checkClaimId.trim()) return;
                  setIsChecking(true);
                  setClaimStatus(null);
                  
                  try {
                    const response = await fetch(`/api/claims?claimId=${checkClaimId}`);
                    const data = await response.json();
                    
                    if (response.ok) {
                      // Capitalize first letter for display
                      const displayStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1);
                      
                      const statusColors: Record<string, string> = {
                        'pending': 'yellow',
                        'processing': 'blue',
                        'approved': 'green',
                        'shipped': 'purple',
                        'delivered': 'emerald',
                        'rejected': 'red'
                      };
                      
                      const statusMessages: Record<string, string> = {
                        'pending': 'Your claim is being reviewed by our team.',
                        'processing': 'Your reward is currently being processed.',
                        'approved': 'Your claim has been approved! Preparing for shipment.',
                        'shipped': 'Your reward has been shipped! Track your delivery.',
                        'delivered': 'Your reward has been delivered successfully!',
                        'rejected': 'Your claim was rejected. Please contact support for details.'
                      };
                      
                      setClaimStatus({
                        status: displayStatus,
                        color: statusColors[data.status.toLowerCase()] || 'gray',
                        message: statusMessages[data.status.toLowerCase()] || 'Status unknown.'
                      });
                    } else {
                      setClaimStatus({
                        status: 'Not Found',
                        color: 'red',
                        message: data.error || 'Claim not found. Please check your Request ID.'
                      });
                    }
                  } catch (error) {
                    console.error('Error checking claim:', error);
                    setClaimStatus({
                      status: 'Error',
                      color: 'red',
                      message: 'Failed to check claim status. Please try again.'
                    });
                  } finally {
                    setIsChecking(false);
                  }
                }}
                disabled={!checkClaimId.trim() || isChecking}
                className={`w-full py-3 rounded-lg font-bold text-lg transition shadow-lg border-2 ${
                  !checkClaimId.trim() || isChecking
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'text-white'
                }`}
                style={!checkClaimId.trim() || isChecking ? {} : { background: 'linear-gradient(135deg, #FF7901 0%, #FFA323 100%)', borderColor: '#FFA323', boxShadow: 'none' }}
                onMouseEnter={(e) => {
                  if (!(!checkClaimId.trim() || isChecking)) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #E66D01 0%, #E69320 100%)';
                    e.currentTarget.style.boxShadow = '0 0 12px #FFA323, 0 0 24px #FFA323';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!checkClaimId.trim() || isChecking)) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF7901 0%, #FFA323 100%)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isChecking ? 'Checking...' : 'Check Claim'}
              </button>
              
              {/* Result Field */}
              {claimStatus && (
                <div className={`mt-6 p-4 rounded-lg border-2 animate-scaleIn bg-${claimStatus.color}-900/30 border-${claimStatus.color}-500`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full bg-${claimStatus.color}-500 animate-pulse`}></div>
                    <h3 className={`text-xl font-bold text-${claimStatus.color}-400`}>
                      Status: {claimStatus.status}
                    </h3>
                  </div>
                  <p className="text-gray-300 text-sm">{claimStatus.message}</p>
                  <p className="text-gray-500 text-xs mt-2">Request ID: {checkClaimId}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Modal */}
        <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-yellow-500"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              {/* Success Message */}
              <h2 className="text-2xl font-extrabold text-yellow-400 mb-4">
                Claim Request Received!
              </h2>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                We have received your claim request.
              </p>
              
              {/* Claim ID */}
              <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Your Claim ID:</p>
                <p className="text-xl font-bold text-yellow-300 tracking-wider">{claimId}</p>
              </div>
              
              <p className="text-gray-400 text-sm mb-6">
                Please wait patiently for it to be processed. Thank you!
              </p>
              
              <p className="text-yellow-500 text-sm font-semibold mb-6">
                You can check it in our claims status checker.
              </p>
              
              {/* Close Button */}
              <motion.button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedReward(null);
                }}
                className="w-full bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Got it!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Popup Card */}
        <AnimatePresence>
        {selectedReward && !showSuccessModal && (
          <motion.div 
            id="popup-card" 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 p-4" 
            onClick={() => setSelectedReward(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="popup-modal shadow-2xl w-full text-white relative overflow-hidden rounded-lg" 
              style={{ 
                background: '#0B2335', 
                maxHeight: '90vh', 
                maxWidth: typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1024 ? 'calc(100vw - 10rem)' : '850px',
                overflowY: typeof window !== 'undefined' && window.innerWidth >= 1025 ? 'auto' : 'hidden',
                overflowX: 'hidden',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Row 1: Two Columns */}
              <div className="popup-grid grid grid-cols-1 md:grid-cols-[60%_40%] gap-0" style={{ 
                overflowX: 'hidden',
                overflowY: 'hidden',
                maxHeight: '100%'
              }}>
                {/* Left Column: Image and Thumbnails */}
                <div className="popup-left-column flex flex-col gap-2 md:gap-4 pt-4 md:pt-8 px-4 md:px-8 pb-4 bg-gray-800/20">
                  {/* Main Display Image */}
                  <div className="popup-main-image bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: '658/403' }}>
                    <img 
                      src={
                        (selectedReward as any).galleries && selectedVariant && (selectedReward as any).galleries[selectedVariant]
                          ? (selectedReward as any).galleries[selectedVariant][selectedGalleryImage]
                          : ((selectedReward as any).image || `https://via.placeholder.com/658x403/555555/FFFFFF?text=${encodeURIComponent(selectedReward.name)}`)
                      }
                      alt={`${selectedReward.name} - ${selectedVariant} - Image ${selectedGalleryImage + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Gallery Thumbnails */}
                  <div className="popup-gallery grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div 
                        key={idx} 
                        className={`bg-gray-700 rounded cursor-pointer transition flex items-center justify-center overflow-hidden ${
                          selectedGalleryImage === idx 
                            ? 'ring-2 ring-white' 
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ aspectRatio: '150/100' }}
                        onClick={() => setSelectedGalleryImage(idx)}
                      >
                        <img 
                          src={
                            (selectedReward as any).galleries && selectedVariant && (selectedReward as any).galleries[selectedVariant]
                              ? (selectedReward as any).galleries[selectedVariant][idx]
                              : ((selectedReward as any).image || `https://via.placeholder.com/150x150/555555/FFFFFF?text=${idx + 1}`)
                          }
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Product Details */}
                <div className="popup-right-column pt-4 md:pt-6 px-4 md:px-6 pb-4 space-y-2 flex flex-col justify-end">
                    {/* Product Name */}
                    <h1 className="popup-product-name font-bold text-lg md:text-xl" style={{ lineHeight: '1.2' }}>{selectedReward.name}</h1>
                    <p className="popup-product-subtitle text-gray-400 pb-2 text-xs md:text-sm">{selectedReward.name}</p>
                    
                    {/* Description */}
                    <p className="popup-description text-sm text-gray-400" style={{ fontSize: '9px' }}>Premium quality reward from our exclusive collection. <br/>Limited availability.</p>
                    
                    {/* Variant Options */}
                    {(selectedReward as any).variants && (
                      <div className="popup-variant-section py-1">
                        <label className="popup-variant-label font-semibold text-white uppercase mb-1 block" style={{ fontSize: '9px' }}>
                          SELECT {(selectedReward as any).variants.type.toUpperCase()}:
                        </label>
                      
                        {(selectedReward as any).variants.type === 'color' ? (
                          /* Colored circle buttons for color variants */
                          <div className="flex flex-wrap gap-2">
                            {(selectedReward as any).variants.options.map((option: string) => {
                              const colorMap: { [key: string]: string } = {
                                'Black': '#000000',
                                'White': '#FFFFFF',
                                'Red': '#FF0000',
                                'Blue': '#0000FF',
                                'Silver': '#C0C0C0',
                                'Clear': '#F0F0F0',
                                'Black Titanium': '#2C2C2C',
                                'White Titanium': '#E8E8E8',
                                'Natural Titanium': '#B8956A',
                                'Desert Titanium': '#D4A373',
                                'Alpine White': '#F5F5F5',
                                'Black Sapphire': '#1C1C1C',
                                'San Marino Blue': '#2B4F81',
                                'Green': '#22C55E',
                                'Asteroid Black': '#1A1A1A',
                                'Stardust Blue': '#3B82F6',
                                'Matte Black': '#1A1A1A',
                                'Racing Blue': '#0066CC',
                                'Matte Red': '#B22222'
                              }
                              const bgColor = colorMap[option] || '#808080'
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => {
                                    setSelectedVariant(option)
                                    setSelectedGalleryImage(0)
                                  }}
                                  className={`popup-variant-color relative w-5 h-5 rounded-full transition-all hover:scale-110 ${
                                    selectedVariant === option
                                      ? 'ring-2 ring-white'
                                      : ''
                                  }`}
                                  style={{ backgroundColor: bgColor }}
                                  title={option}
                                >
                                  {option === 'White' || option === 'Clear' || option.includes('White') ? (
                                    <div className="absolute inset-0 rounded-full border border-gray-400" />
                                  ) : null}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          /* Text buttons for non-color variants */
                          <div className="flex flex-wrap gap-2">
                            {(selectedReward as any).variants.options.map((option: string) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setSelectedVariant(option)
                                  setSelectedGalleryImage(0)
                                }}
                                className={`popup-variant-button px-2 py-1 rounded-lg font-semibold transition ${
                                  selectedVariant === option
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                                }`}
                                style={{ fontSize: '8px' }}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Points */}
                    <div className="popup-points flex items-center gap-2">
                      <img src="/pts.png" alt="Points" className="popup-points-icon w-4 h-4" />
                      <span className="popup-points-text font-bold text-yellow-500" style={{ fontSize: '16px' }}>{selectedReward.points.toLocaleString()}</span>
                    </div>
                    
                    {/* Claiming Process */}
                    <div className="popup-claiming-process bg-gray-800/50 rounded-lg pt-2 pb-3 px-4 border" style={{ borderColor: '#344459' }}>
                      <h3 className="popup-claiming-title font-bold text-[#FFD257] mb-1" style={{ fontSize: '9px' }}>Claiming Process:</h3>
                      <ol className="popup-claiming-list text-gray-300 space-y-1 list-decimal list-inside" style={{ fontSize: '8px' }}>
                        <li>Fill out the claim form below.</li>
                        <li>Wait for admin approval (24-48 hours).</li>
                        <li>Receive confirmation via email/SMS.</li>
                        <li>Claim your reward or receive delivery.</li>
                      </ol>
                    </div>
                </div>
              </div>

              {/* Row 2: Claim Form (Full Width) */}
              <div className="popup-form px-4 md:px-20 pb-4">
                <h3 className="popup-form-title font-bold text-white mb-2 text-sm md:text-base">Complete Your Claim</h3>
                
                <form className="popup-claim-form space-y-2" onSubmit={async (e) => { 
                  e.preventDefault(); 
                  
                  const formData = new FormData(e.currentTarget);
                  const phoneNumber = formData.get('phoneNumber');
                  const ewalletAccount = formData.get('ewalletAccount');
                  
                  const claimData = {
                    rewardId: selectedReward.id,
                    variantOption: selectedVariant,
                    username: formData.get('username'),
                    fullName: formData.get('fullName'),
                    phoneNumber: phoneNumber ? `+63${phoneNumber}` : null,
                    deliveryAddress: formData.get('deliveryAddress'),
                    ewalletName: formData.get('ewalletName'),
                    ewalletAccount: ewalletAccount ? `+63${ewalletAccount}` : null
                  };
                  
                  try {
                    const response = await fetch('/api/claims', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                      },
                      body: JSON.stringify(claimData)
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                      setClaimId(data.claimId);
                      setShowSuccessModal(true);
                    } else {
                      alert('Error submitting claim: ' + data.error);
                    }
                  } catch (error) {
                    console.error('Error submitting claim:', error);
                    alert('Failed to submit claim. Please try again.');
                  }
                }}>
                  {/* Form Fields */}
                  {(selectedReward as any).category === 'E-wallet' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          name="username"
                          placeholder="Username" 
                          className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                          required 
                        />
                        <input 
                          type="text" 
                          name="fullName"
                          placeholder="Full Name" 
                          className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                          pattern="[A-Za-z ]+"
                          title="Please enter letters and spaces only"
                          onInput={(e: React.FormEvent<HTMLInputElement>) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z ]/g, '')
                          }}
                          required 
                        />
                      </div>
                      <input 
                        type="email" 
                        name="email"
                        placeholder="Email Address" 
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                        required 
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          name="ewalletName"
                          placeholder="E-wallet Name (GCash/Maya)" 
                          className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                          pattern="[A-Za-z ]+"
                          title="Please enter letters and spaces only"
                          onInput={(e: React.FormEvent<HTMLInputElement>) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z ]/g, '')
                          }}
                          required 
                        />
                        <div className="relative ewallet-container-mobile">
                          {/* Mobile styling - Edit these values for mobile customization */}
                          <style jsx>{`
                            /* Mobile styles (screens under 768px) */
                            @media (max-width: 767px) {
                              .ewallet-container-mobile { margin-top: -2px !important; }
                              .ph-flag-ewallet { width: 13px !important; height: 10px !important; }
                              .ph-code-ewallet { font-size: 9px !important; line-height: 8px !important; margin-bottom: 0px !important; }
                              .ph-input-ewallet { padding-left: 50px !important; padding-top: 6px !important; padding-bottom: 6px !important; }
                              .ph-prefix-container-ewallet { align-items: flex-end !important; height: 10px !important; }
                            }
                            /* Desktop styles (screens 768px and above) */
                            @media (min-width: 768px) {
                              .ph-flag-ewallet { width: 20px !important; height: 14px !important; }
                              .ph-code-ewallet { font-size: 14px !important; }
                              .ph-input-ewallet { padding-left: 80px !important; }
                              .ph-prefix-container-ewallet { align-items: center !important; }
                            }
                          `}</style>
                          <div className="ph-prefix-container-ewallet absolute left-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none select-none" style={{ color: '#d1d5db', zIndex: 10 }}>
                            <svg viewBox="0 0 20 14" className="rounded-sm ph-flag-ewallet">
                              <rect width="20" height="7" fill="#0038A8"/>
                              <rect y="7" width="20" height="7" fill="#CE1126"/>
                              <path d="M0,0 L7,7 L0,14 Z" fill="#FFFFFF"/>
                              <circle cx="3.5" cy="3" r="1" fill="#FCD116"/>
                              <circle cx="3.5" cy="11" r="1" fill="#FCD116"/>
                              <circle cx="5.5" cy="7" r="1" fill="#FCD116"/>
                            </svg>
                            <span className="ph-code-ewallet" style={{ whiteSpace: 'nowrap' }}>+63</span>
                          </div>
                          <input 
                            type="text" 
                            name="ewalletAccount"
                            placeholder="900 000 0000" 
                            className="w-full ph-input-ewallet pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                            maxLength={13}
                            title="Please enter 10 digits"
                            onInput={(e: React.FormEvent<HTMLInputElement>) => {
                              let value = e.currentTarget.value.replace(/[^0-9]/g, '')
                              if (value.length > 10) value = value.slice(0, 10)
                              // Format as XXX XXX XXXX
                              if (value.length > 6) {
                                e.currentTarget.value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`
                              } else if (value.length > 3) {
                                e.currentTarget.value = `${value.slice(0, 3)} ${value.slice(3)}`
                              } else {
                                e.currentTarget.value = value
                              }
                              // Set custom validity based on digit count
                              const digitCount = value.length
                              if (digitCount !== 10 && digitCount > 0) {
                                e.currentTarget.setCustomValidity('Please enter exactly 10 digits')
                              } else {
                                e.currentTarget.setCustomValidity('')
                              }
                            }}
                            required 
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          name="username"
                          placeholder="Username" 
                          className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                          required 
                        />
                        <input 
                          type="text" 
                          name="fullName"
                          placeholder="Full Name" 
                          className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                          pattern="[A-Za-z ]+"
                          title="Please enter letters and spaces only"
                          onInput={(e: React.FormEvent<HTMLInputElement>) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z ]/g, '')
                          }}
                          required 
                        />
                      </div>
                      <input 
                        type="email" 
                        name="email"
                        placeholder="Email Address" 
                        className="email-input-mobile w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                          const isValid = emailRegex.test(e.currentTarget.value)
                          e.currentTarget.className = `email-input-mobile w-full px-3 py-2 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none text-sm ${isValid || e.currentTarget.value === '' ? 'border-gray-600 focus:border-orange-500' : 'border-red-500 focus:border-red-500'}`
                        }}
                        required 
                      />
                      <div className="relative phone-container-mobile">
                        {/* Mobile styling - Edit these values for mobile customization */}
                        <style jsx>{`
                          /* Mobile styles (screens under 768px) */
                          @media (max-width: 767px) {
                            .email-input-mobile { padding-top: 6px !important; padding-bottom: 6px !important; }
                            .phone-container-mobile { margin-top: 2px !important; }
                            .ph-flag-phone { width: 13px !important; height: 10px !important; }
                            .ph-code-phone { font-size: 9px !important; line-height: 8.5px !important; margin-bottom: 0px !important; }
                            .ph-input-phone { padding-left: 50px !important; padding-top: 6px !important; padding-bottom: 6px !important; }
                            .ph-prefix-container-phone { align-items: flex-end !important; height: 10px !important; }
                          }
                          /* Desktop styles (screens 768px and above) */
                          @media (min-width: 768px) {
                            .ph-flag-phone { width: 20px !important; height: 14px !important; }
                            .ph-code-phone { font-size: 14px !important; }
                            .ph-input-phone { padding-left: 80px !important; }
                            .ph-prefix-container-phone { align-items: center !important; }
                          }
                        `}</style>
                        <div className="ph-prefix-container-phone absolute left-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none select-none" style={{ color: '#d1d5db', zIndex: 10 }}>
                          <svg viewBox="0 0 20 14" className="rounded-sm ph-flag-phone">
                            <rect width="20" height="7" fill="#0038A8"/>
                            <rect y="7" width="20" height="7" fill="#CE1126"/>
                            <path d="M0,0 L7,7 L0,14 Z" fill="#FFFFFF"/>
                            <circle cx="3.5" cy="3" r="1" fill="#FCD116"/>
                            <circle cx="3.5" cy="11" r="1" fill="#FCD116"/>
                            <circle cx="5.5" cy="7" r="1" fill="#FCD116"/>
                          </svg>
                          <span className="ph-code-phone" style={{ whiteSpace: 'nowrap' }}>+63</span>
                        </div>
                        <input 
                          type="tel" 
                          name="phoneNumber"
                          placeholder="900 000 0000" 
                          className="w-full ph-input-phone pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                          maxLength={13}
                          title="Please enter 10 digits"
                          onInput={(e: React.FormEvent<HTMLInputElement>) => {
                            let value = e.currentTarget.value.replace(/[^0-9]/g, '')
                            if (value.length > 10) value = value.slice(0, 10)
                            // Format as XXX XXX XXXX
                            if (value.length > 6) {
                              e.currentTarget.value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`
                            } else if (value.length > 3) {
                              e.currentTarget.value = `${value.slice(0, 3)} ${value.slice(3)}`
                            } else {
                              e.currentTarget.value = value
                            }
                            // Set custom validity based on digit count
                            const digitCount = value.length
                            if (digitCount !== 10 && digitCount > 0) {
                              e.currentTarget.setCustomValidity('Please enter exactly 10 digits')
                            } else {
                              e.currentTarget.setCustomValidity('')
                            }
                          }}
                          required 
                        />
                      </div>
                      <input 
                        type="text"
                        name="deliveryAddress"
                        placeholder="Complete Delivery Address" 
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-sm" 
                        required 
                      />
                    </>
                  )}
                  
                  {/* Submit Button */}
                  <motion.button 
                    type="submit" 
                    className="w-full text-white px-4 py-3 rounded-lg font-bold transition text-sm md:text-base" 
                    style={{ background: 'linear-gradient(90deg, #FF7901 0%, #FFA323 100%)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    CONFIRM CLAIM
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
      </div>
        </>
      )}
    </div>
  );
}
