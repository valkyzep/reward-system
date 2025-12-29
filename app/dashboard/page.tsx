"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const basePath = process.env.NODE_ENV === 'production' ? '/reward-system' : ''

const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return 'N/A'
  // Remove +639 prefix if present and format as +639 XX XXX XXXX
  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('639') ? digits.slice(3) : digits
  if (number.length === 9) {
    return `+639 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`
  }
  return phone
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState('')
  const [showManageRewards, setShowManageRewards] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showActionHistory, setShowActionHistory] = useState(false)
  const [showBannerSettings, setShowBannerSettings] = useState(false)
  const [bannerSettingsTab, setBannerSettingsTab] = useState<'top' | 'bottom'>('top')
  const [topBannerImage, setTopBannerImage] = useState<string | File>('')
  const [bottomBanner1Image, setBottomBanner1Image] = useState<string | File>('')
  const [bottomBanner2Image, setBottomBanner2Image] = useState<string | File>('')
  const [bottomBanner3Image, setBottomBanner3Image] = useState<string | File>('')
  const [bottomBanner1Link, setBottomBanner1Link] = useState('https://www.facebook.com')
  const [bottomBanner2Link, setBottomBanner2Link] = useState('https://www.tiktok.com')
  const [bottomBanner3Link, setBottomBanner3Link] = useState('https://www.instagram.com')
  const [additionalBanners, setAdditionalBanners] = useState<Array<{id: number, image: string | File, link: string}>>([])
  const [nextBannerId, setNextBannerId] = useState(4)
  const [carouselInterval, setCarouselInterval] = useState(5)
  const [isSavingBanners, setIsSavingBanners] = useState(false)
  const [rewardsList, setRewardsList] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ name: '', points: '', category: '', quantity: '', images: [] as string[] })
  const [showAddCard, setShowAddCard] = useState(false)
  const [newReward, setNewReward] = useState({ name: '', points: '', category: 'Gadget', quantity: '', images: [] as string[] })
  const [editingImages, setEditingImages] = useState<(string | File)[]>(['', '', '', ''])
  const [newImages, setNewImages] = useState<(string | File)[]>(['', '', '', ''])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'rejected'>('pending')
  
  // Category and Variant Type Management
  const [categories, setCategories] = useState<any[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  // Reward Form Modal
  const [showRewardForm, setShowRewardForm] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    description: '',
    category: 'Gadget',
    points: '',
    quantity: '',
    tier: 'bronze',
    images: ['', '', '', ''] as (string | File)[],
    discounted_price: '',
    discount_end_date: ''
  })
  const [showRejectPopup, setShowRejectPopup] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  const [deleteWarningData, setDeleteWarningData] = useState({ rewardId: '', claimCount: 0 })
  const [showPasswordVerification, setShowPasswordVerification] = useState(false)
  const [verificationPassword, setVerificationPassword] = useState('')
  
  // Manage Rewards Tab State
  const [manageRewardsTab, setManageRewardsTab] = useState<'rewards' | 'inventory' | 'analytics' | 'history'>('rewards')
  const [inventoryTab, setInventoryTab] = useState<'restock' | 'history'>('restock')
  const [actionHistory, setActionHistory] = useState<any[]>([])
  const [restockingHistory, setRestockingHistory] = useState<any[]>([])
  const [restockQuantities, setRestockQuantities] = useState<Record<string, string>>({})
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryCategory, setInventoryCategory] = useState('all')
  const [stockSort, setStockSort] = useState<'none' | 'asc' | 'desc'>('none')
  const [historySearch, setHistorySearch] = useState('')
  const [historyFromDate, setHistoryFromDate] = useState('')
  const [historyToDate, setHistoryToDate] = useState('')
  const [historyCategory, setHistoryCategory] = useState('all')
  const [restockPage, setRestockPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [auditPage, setAuditPage] = useState(1)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditFromDate, setAuditFromDate] = useState('')
  const [auditToDate, setAuditToDate] = useState('')
  const [auditAction, setAuditAction] = useState('all')
  const [auditAdmin, setAuditAdmin] = useState('all')
  const itemsPerPage = 15
  
  // Requests Filter States
  const [requestsSearch, setRequestsSearch] = useState('')
  const [requestsFromDate, setRequestsFromDate] = useState('')
  const [requestsToDate, setRequestsToDate] = useState('')
  const [requestsPage, setRequestsPage] = useState(1)
  const [requestsPointsSort, setRequestsPointsSort] = useState<'asc' | 'desc' | null>(null)
  
  // Manage Rewards Filter States
  const [rewardsSearch, setRewardsSearch] = useState('')
  const [rewardsCategory, setRewardsCategory] = useState('all')
  const [rewardsTier, setRewardsTier] = useState('all')
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const [rewardsPage, setRewardsPage] = useState(1)
  const rewardsPerPage = 10
  
  const [requests, setRequests] = useState<any[]>([])
  
  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const processingCount = requests.filter(r => r.status === 'processing').length
  const shippedCount = requests.filter(r => r.status === 'shipped').length
  const deliveredCount = requests.filter(r => r.status === 'delivered').length
  const rejectedCount = requests.filter(r => r.status === 'rejected').length

  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth')
    if (auth !== 'true') {
      router.push('/login')
    } else {
      setIsAuthenticated(true)
      
      // Function to fetch and store CSRF token
      const refreshCsrfToken = () => {
        return fetch('/api/csrf')
          .then(res => res.json())
          .then(data => {
            setCsrfToken(data.csrfToken)
            sessionStorage.setItem('csrfToken', data.csrfToken)
            return data.csrfToken
          })
      }
      
      // Try to get token from sessionStorage first, otherwise fetch new one
      const storedToken = sessionStorage.getItem('csrfToken')
      if (storedToken) {
        setCsrfToken(storedToken)
        // Load data immediately with stored token
        Promise.all([fetchClaims(), fetchRewards(), fetchCategories(), fetchRestockingHistory(), loadBannerSettings()])
          .finally(() => setIsLoading(false))
        // Refresh token in background to ensure it's valid
        refreshCsrfToken().catch(err => console.error('Failed to refresh CSRF token:', err))
      } else {
        // Fetch CSRF token first, then load data
        refreshCsrfToken()
          .then(() => Promise.all([fetchClaims(), fetchRewards(), fetchCategories(), fetchRestockingHistory(), loadBannerSettings()]))
          .finally(() => setIsLoading(false))
          .catch(err => console.error('Failed to initialize dashboard:', err))
      }
    }
  }, [router])

  // Refresh CSRF token on page visibility change (after idle)
  useEffect(() => {
    if (!isAuthenticated) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - refresh CSRF token
        fetch('/api/csrf')
          .then(res => res.json())
          .then(data => {
            setCsrfToken(data.csrfToken)
            sessionStorage.setItem('csrfToken', data.csrfToken)
          })
          .catch(err => console.error('Failed to refresh CSRF token:', err))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated])

  // Auto-refresh claims data every 3 seconds for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return

    const intervalId = setInterval(() => {
      fetchClaims()
    }, 3000) // Refresh every 3 seconds

    return () => clearInterval(intervalId) // Cleanup on unmount
  }, [isAuthenticated])

  // Reset pagination when filters change
  useEffect(() => {
    setRewardsPage(1)
  }, [rewardsSearch, rewardsCategory, rewardsTier, hideOutOfStock])

  useEffect(() => {
    setRestockPage(1)
  }, [inventorySearch, inventoryCategory, stockSort])

  useEffect(() => {
    setHistoryPage(1)
  }, [historySearch, historyFromDate, historyToDate, historyCategory])

  useEffect(() => {
    setAuditPage(1)
  }, [auditSearch, auditFromDate, auditToDate, auditAction, auditAdmin])

  useEffect(() => {
    setRequestsSearch('')
    setRequestsFromDate('')
    setRequestsToDate('')
    setRequestsPage(1)
    setRequestsPointsSort(null)
  }, [activeTab])

  useEffect(() => {
    setRequestsPage(1)
  }, [requestsSearch, requestsFromDate, requestsToDate])

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/admin/claims')
      const data = await response.json()
      if (Array.isArray(data)) {
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
    }
  }

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/admin/rewards')
      const data = await response.json()
      if (Array.isArray(data)) {
        setRewardsList(data)
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
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

  const fetchRestockingHistory = async () => {
    try {
      const response = await fetch('/api/admin/restocking')
      const data = await response.json()
      if (Array.isArray(data)) {
        const formattedHistory = data.map((entry: any) => ({
          date: new Date(entry.created_at).toLocaleString(),
          rewardName: entry.reward_name,
          model: entry.reward_model || '',
          category: entry.reward_category || 'N/A',
          quantityAdded: entry.quantity_added,
          admin: entry.admin_user
        }))
        setRestockingHistory(formattedHistory)
      }
    } catch (error) {
      console.error('Error fetching restocking history:', error)
    }
  }

  // Load banner settings from database
  const loadBannerSettings = async () => {
    try {
      const response = await fetch('/api/banner-settings')
      if (response.ok) {
        const data = await response.json()
        setTopBannerImage(data.top_banner_image || '')
        if (data.bottom_banner_images && data.bottom_banner_images.length >= 3) {
          setBottomBanner1Image(data.bottom_banner_images[0] || '')
          setBottomBanner2Image(data.bottom_banner_images[1] || '')
          setBottomBanner3Image(data.bottom_banner_images[2] || '')
          
          // Load additional banners beyond the first 3
          if (data.bottom_banner_images.length > 3) {
            const additionalBannersData = []
            for (let i = 3; i < data.bottom_banner_images.length; i++) {
              additionalBannersData.push({
                id: i + 1,
                image: data.bottom_banner_images[i] || '',
                link: data.bottom_banner_links?.[i] || ''
              })
            }
            setAdditionalBanners(additionalBannersData)
            setNextBannerId(data.bottom_banner_images.length + 1)
          }
        }
        if (data.bottom_banner_links && data.bottom_banner_links.length >= 3) {
          setBottomBanner1Link(data.bottom_banner_links[0] || 'https://www.facebook.com')
          setBottomBanner2Link(data.bottom_banner_links[1] || 'https://www.tiktok.com')
          setBottomBanner3Link(data.bottom_banner_links[2] || 'https://www.instagram.com')
        }
        setCarouselInterval(data.carousel_interval || 5)
      }
    } catch (error) {
      console.error('Error loading banner settings:', error)
    }
  }

  // Save banner settings to database
  const saveBannerSettings = async () => {
    setIsSavingBanners(true)
    try {
      // Upload images if they are File objects
      let topBannerUrl = typeof topBannerImage === 'string' ? topBannerImage : ''
      let banner1Url = typeof bottomBanner1Image === 'string' ? bottomBanner1Image : ''
      let banner2Url = typeof bottomBanner2Image === 'string' ? bottomBanner2Image : ''
      let banner3Url = typeof bottomBanner3Image === 'string' ? bottomBanner3Image : ''

      // Upload top banner if it's a file
      if (topBannerImage instanceof File) {
        const formData = new FormData()
        formData.append('file', topBannerImage)
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken
          },
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          topBannerUrl = uploadData.url
        } else {
          const errorData = await uploadResponse.json()
          console.error('Top banner upload failed:', uploadResponse.status, errorData)
          alert(`Failed to upload top banner: ${errorData.error || 'Unknown error'}`)
          throw new Error('Top banner upload failed')
        }
      }

      // Upload bottom banner 1 if it's a file
      if (bottomBanner1Image instanceof File) {
        const formData = new FormData()
        formData.append('file', bottomBanner1Image)
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken
          },
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          banner1Url = uploadData.url
        } else {
          const errorData = await uploadResponse.json()
          console.error('Bottom banner 1 upload failed:', uploadResponse.status, errorData)
          alert(`Failed to upload bottom banner 1: ${errorData.error || 'Unknown error'}`)
          throw new Error('Bottom banner 1 upload failed')
        }
      }

      // Upload bottom banner 2 if it's a file
      if (bottomBanner2Image instanceof File) {
        const formData = new FormData()
        formData.append('file', bottomBanner2Image)
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken
          },
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          banner2Url = uploadData.url
        } else {
          const errorData = await uploadResponse.json()
          console.error('Bottom banner 2 upload failed:', uploadResponse.status, errorData)
          alert(`Failed to upload bottom banner 2: ${errorData.error || 'Unknown error'}`)
          throw new Error('Bottom banner 2 upload failed')
        }
      }

      // Upload bottom banner 3 if it's a file
      if (bottomBanner3Image instanceof File) {
        const formData = new FormData()
        formData.append('file', bottomBanner3Image)
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken
          },
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          banner3Url = uploadData.url
        } else {
          const errorData = await uploadResponse.json()
          console.error('Bottom banner 3 upload failed:', uploadResponse.status, errorData)
          alert(`Failed to upload bottom banner 3: ${errorData.error || 'Unknown error'}`)
          throw new Error('Bottom banner 3 upload failed')
        }
      }

      // Upload additional banners
      const additionalBannerUrls: string[] = []
      const additionalBannerLinks: string[] = []
      for (const banner of additionalBanners) {
        let bannerUrl = typeof banner.image === 'string' ? banner.image : ''
        if (banner.image instanceof File) {
          const formData = new FormData()
          formData.append('file', banner.image)
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'x-csrf-token': csrfToken
            },
            body: formData,
          })
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            bannerUrl = uploadData.url
          } else {
            const errorData = await uploadResponse.json()
            console.error('Additional banner upload failed:', uploadResponse.status, errorData)
            alert(`Failed to upload additional banner: ${errorData.error || 'Unknown error'}`)
            throw new Error('Additional banner upload failed')
          }
        }
        if (bannerUrl) {
          additionalBannerUrls.push(bannerUrl)
          additionalBannerLinks.push(banner.link)
        }
      }

      // Combine all banner images and links
      const allBannerImages = [banner1Url, banner2Url, banner3Url, ...additionalBannerUrls]
      const allBannerLinks = [bottomBanner1Link, bottomBanner2Link, bottomBanner3Link, ...additionalBannerLinks]

      // Save banner settings to database
      const response = await fetch('/api/banner-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          top_banner_image: topBannerUrl,
          bottom_banner_images: allBannerImages,
          bottom_banner_links: allBannerLinks,
          carousel_interval: carouselInterval
        })
      })

      if (response.ok) {
        alert('Banner settings saved successfully!')
        setShowBannerSettings(false)
        // Reload the page to show updated banners
        window.location.reload()
      } else {
        alert('Failed to save banner settings')
      }
    } catch (error) {
      console.error('Error saving banner settings:', error)
      alert('Error saving banner settings')
    } finally {
      setIsSavingBanners(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    router.push('/login')
  }

  const handleDeleteReward = async (id: string | number) => {
    try {
      const response = await fetch(`/api/admin/rewards?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setRewardsList(rewardsList.filter(reward => String(reward.id) !== String(id)))
      } else if (data.claimCount !== undefined) {
        // Show warning modal for rewards with claims
        setDeleteWarningData({ rewardId: String(id), claimCount: data.claimCount })
        setShowDeleteWarning(true)
      } else {
        setErrorMessage(data.error || 'Failed to delete reward')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error deleting reward:', error)
      setErrorMessage('Error deleting reward')
      setShowErrorModal(true)
    }
  }
  
  const handleConfirmDelete = async () => {
    setShowDeleteWarning(false)
    setShowPasswordVerification(true)
  }
  
  const handlePasswordVerifiedDelete = async () => {
    if (!verificationPassword) {
      setErrorMessage('Password is required')
      setShowErrorModal(true)
      return
    }
    
    try {
      // Verify password first
      const verifyResponse = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ password: verificationPassword })
      })
      
      if (!verifyResponse.ok) {
        setErrorMessage('Invalid password')
        setShowErrorModal(true)
        setVerificationPassword('')
        return
      }
      
      // Password verified, proceed with deletion
      const response = await fetch(`/api/admin/rewards?id=${deleteWarningData.rewardId}&force=true`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken
        }
      })
      
      if (response.ok) {
        setRewardsList(rewardsList.filter(reward => String(reward.id) !== String(deleteWarningData.rewardId)))
        setShowPasswordVerification(false)
        setVerificationPassword('')
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to delete reward')
        setShowErrorModal(true)
        setShowPasswordVerification(false)
        setVerificationPassword('')
      }
    } catch (error) {
      console.error('Error deleting reward:', error)
      setErrorMessage('Error deleting reward')
      setShowErrorModal(true)
      setShowPasswordVerification(false)
      setVerificationPassword('')
    }
  }

  const handleEditReward = (id: string | number) => {
    const reward = rewardsList.find(r => String(r.id) === String(id))
    if (reward) {
      setEditingId(String(id))
      setEditValues({ 
        name: reward.name, 
        points: reward.points.toString(), 
        category: (reward as any).category || 'Gadget', 
        quantity: ((reward as any).quantity || 0).toString(),
        images: reward.images || []
      })
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          id,
          name: editValues.name,
          points: editValues.points,
          category: editValues.category,
          quantity: editValues.quantity,
          images: editValues.images
        })
      })
      
      if (response.ok) {
        // Refresh rewards list from database
        await fetchRewards()
        setEditingId(null)
        setEditValues({ name: '', points: '', category: '', quantity: '', images: [] })
      } else {
        alert('Failed to update reward')
      }
    } catch (error) {
      console.error('Error updating reward:', error)
      alert('Error updating reward')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValues({ name: '', points: '', category: '', quantity: '', images: [] })
    setEditingImages(['', '', '', ''])
  }

  // New form handlers
  const handleOpenAddForm = () => {
    setFormMode('add')
    setFormData({
      name: '',
      model: '',
      description: '',
      category: categories[0]?.name || 'Gadget',
      points: '',
      quantity: '',
      tier: 'bronze',
      images: ['', '', '', ''],
      discounted_price: '',
      discount_end_date: ''
    })
    setShowRewardForm(true)
  }

  const handleOpenEditForm = (reward: any) => {
    setFormMode('edit')
    setEditingId(reward.id)
    
    // Format discount_end_date for datetime-local input
    let formattedDiscountDate = ''
    if (reward.discount_end_date) {
      const date = new Date(reward.discount_end_date)
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      formattedDiscountDate = date.toISOString().slice(0, 16)
    }
    
    setFormData({
      name: reward.name,
      model: reward.model || '',
      description: reward.description || '',
      category: reward.category,
      points: reward.points.toString(),
      quantity: reward.quantity?.toString() || '0',
      tier: (reward as any).tier || 'bronze',
      images: reward.images || ['', '', '', ''],
      discounted_price: (reward.discounted_price || '').toString(),
      discount_end_date: formattedDiscountDate
    })
    setShowRewardForm(true)
  }

  const downloadCSV = () => {
    const headers = ['Brand Name', 'Category', 'Current Stock', 'Points']
    const csvData = rewardsList.map(reward => [
      reward.name,
      (reward as any).category || 'N/A',
      (reward as any).quantity || 0,
      reward.points
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadHistoryCSV = () => {
    const filtered = restockingHistory.filter(entry => {
      const matchesSearch = entry.rewardName.toLowerCase().includes(historySearch.toLowerCase())
      const matchesCategory = historyCategory === 'all' || entry.category === historyCategory
      
      let matchesDate = true
      if (historyFromDate || historyToDate) {
        const entryDate = new Date(entry.date)
        if (historyFromDate) {
          const fromDate = new Date(historyFromDate)
          matchesDate = matchesDate && entryDate >= fromDate
        }
        if (historyToDate) {
          const toDate = new Date(historyToDate)
          toDate.setHours(23, 59, 59, 999)
          matchesDate = matchesDate && entryDate <= toDate
        }
      }
      
      return matchesSearch && matchesCategory && matchesDate
    })
    
    const headers = ['Date', 'Reward', 'Category', 'Quantity Added', 'Admin']
    const csvData = filtered.map(entry => [
      entry.date,
      entry.rewardName,
      entry.category,
      entry.quantityAdded,
      entry.admin
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `restocking_history_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImageChange = (index: number, value: string | File) => {
    const updatedImages = [...formData.images]
    updatedImages[index] = value
    setFormData({ ...formData, images: updatedImages })
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      })

      if (response.ok) {
        await fetchCategories()
        setNewCategoryName('')
        setShowAddCategory(false)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add category')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Failed to add category')
    }
  }

  const handleSubmitRewardForm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Upload files and get URLs
      const imageUrls: string[] = []
      
      for (const img of formData.images) {
        if (!img) {
          imageUrls.push('')
          continue
        }
        
        if (typeof img === 'string') {
          imageUrls.push(img) // Already a URL
        } else {
          // Upload file
          const uploadFormData = new FormData()
          uploadFormData.append('file', img)
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'x-csrf-token': csrfToken
            },
            body: uploadFormData
          })
          
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json()
            throw new Error(errorData.error || 'Failed to upload image')
          }
          const {url} = await uploadRes.json()
          imageUrls.push(url)
        }
      }

      if (formMode === 'add') {
        const response = await fetch('/api/admin/rewards', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({
            name: formData.name,
            model: formData.model,
            description: formData.description,
            points: parseInt(formData.points) || 0,
            category: formData.category,
            quantity: 0,
            tier: formData.tier,
            images: imageUrls,
            discounted_price: formData.discounted_price ? parseInt(formData.discounted_price) : null,
            discount_end_date: formData.discount_end_date || null
          })
        })
        if (response.ok) {
          await fetchRewards()
          setShowRewardForm(false)
        } else {
          alert('Failed to add reward')
        }
      } else {
        const response = await fetch('/api/admin/rewards', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({
            id: editingId,
            name: formData.name,
            model: formData.model,
            description: formData.description,
            points: parseInt(formData.points) || 0,
            category: formData.category,
            tier: formData.tier,
            quantity: parseInt(formData.quantity) || 0,
            images: imageUrls,
            discounted_price: formData.discounted_price ? parseInt(formData.discounted_price) : null,
            discount_end_date: formData.discount_end_date || null
          })
        })
        if (response.ok) {
          await fetchRewards()
          setShowRewardForm(false)
          setEditingId(null)
        } else {
          alert('Failed to update reward')
        }
      }
    } catch (error) {
      console.error('Error submitting reward:', error)
      alert(`Error submitting reward: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          name: newReward.name,
          points: newReward.points,
          category: newReward.category,
          quantity: newReward.quantity,
          images: newReward.images
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Refresh rewards list from database
        await fetchRewards()
        setNewReward({ name: '', points: '', category: 'Gadget', quantity: '', images: [] })
        setShowAddCard(false)
      } else {
        alert('Failed to add reward')
      }
    } catch (error) {
      console.error('Error adding reward:', error)
      alert('Error adding reward')
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!csrfToken) {
      setErrorMessage('Security token not loaded. Please refresh the page.')
      setShowErrorModal(true)
      return
    }
    
    try {
      const response = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ claimId: requestId, status: 'approved' })
      })
      if (response.ok) {
        // Refresh claims to get updated data with admin_user
        await fetchClaims()
        // Refresh rewards list to update quantity
        await fetchRewards()
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to approve claim')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Error approving claim:', error)
      setErrorMessage('Error approving claim')
      setShowErrorModal(true)
    }
  }

  const handleRejectClick = (requestId: string) => {
    setRejectingRequestId(requestId)
    setShowRejectPopup(true)
  }

  const handleRestockUpdate = async (rewardId: string | number) => {
    const quantity = restockQuantities[rewardId]
    if (!quantity || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    try {
      const reward = rewardsList.find(r => r.id === rewardId)
      const currentQuantity = (reward as any)?.quantity || 0
      const newQuantity = currentQuantity + parseInt(quantity)

      const response = await fetch(`/api/admin/rewards`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
          id: rewardId,
          name: reward?.name,
          model: (reward as any)?.model || '',
          points: reward?.points,
          category: (reward as any)?.category || 'Gadget',
          quantity: newQuantity,
          tier: (reward as any)?.tier || 'bronze',
          images: reward?.images || []
        })
      })

      if (response.ok) {
        // Save to restocking history database
        await fetch('/api/admin/restocking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({
            reward_id: rewardId,
            reward_name: reward?.name,
            reward_model: (reward as any)?.model || '',
            reward_category: (reward as any)?.category || 'N/A',
            quantity_added: parseInt(quantity),
            admin_user: 'Admin'
          })
        })

        // Clear the input field
        setRestockQuantities(prev => ({ ...prev, [rewardId]: '' }))
        
        // Refresh rewards list and restocking history
        await fetchRewards()
        await fetchRestockingHistory()
        
        alert('Inventory updated successfully!')
      } else {
        const errorData = await response.json()
        alert('Failed to update inventory: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
      alert('Error updating inventory: ' + error)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csrfToken) {
      setErrorMessage('Security token not loaded. Please refresh the page.')
      setShowErrorModal(true)
      setShowRejectPopup(false)
      return
    }
    
    if (rejectingRequestId) {
      try {
        const response = await fetch('/api/admin/claims', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({ 
            claimId: rejectingRequestId, 
            status: 'rejected',
            rejectionReason: rejectReason 
          })
        })
        if (response.ok) {
          setRequests(requests.map(req => 
            req.id === rejectingRequestId ? { ...req, status: 'rejected' as const, reason: rejectReason } : req
          ))
        }
      } catch (error) {
        console.error('Error rejecting claim:', error)
      }
    }
    setShowRejectPopup(false)
    setRejectReason('')
    setRejectingRequestId(null)
  }

  const handleRejectCancel = () => {
    setShowRejectPopup(false)
    setRejectReason('')
    setRejectingRequestId(null)
  }

  const handleMoveToProcessing = async (requestId: string) => {
    if (!csrfToken) {
      setErrorMessage('Security token not loaded. Please refresh the page.')
      setShowErrorModal(true)
      return
    }
    
    try {
      const response = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ claimId: requestId, status: 'processing' })
      })
      if (response.ok) {
        await fetchClaims()
      }
    } catch (error) {
      console.error('Error updating claim:', error)
    }
  }

  const handleMoveToShipped = async (requestId: string) => {
    if (!csrfToken) {
      setErrorMessage('Security token not loaded. Please refresh the page.')
      setShowErrorModal(true)
      return
    }
    
    try {
      const response = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ claimId: requestId, status: 'shipped' })
      })
      if (response.ok) {
        await fetchClaims()
      }
    } catch (error) {
      console.error('Error updating claim:', error)
    }
  }

  const handleMoveToDelivered = async (requestId: string) => {
    if (!csrfToken) {
      setErrorMessage('Security token not loaded. Please refresh the page.')
      setShowErrorModal(true)
      return
    }
    
    try {
      const response = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ claimId: requestId, status: 'delivered' })
      })
      if (response.ok) {
        await fetchClaims()
      }
    } catch (error) {
      console.error('Error updating claim:', error)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1117] via-[#1a1d24] to-[#23272f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mb-4"></div>
          <p className="text-yellow-400 text-xl font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181c23] text-white">
      {/* Header */}
      <div className="bg-[#23272f] border-b border-yellow-700 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/Time2Claim.png" alt="Time2Claim Logo" className="w-[140px]" />
          <span className="text-yellow-400 font-bold text-xl">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBannerSettings(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ads Banner Settings
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Admin Panel Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400 text-lg">Manage rewards, inventory, and claim requests</p>
          
          {/* Admin Panel Cards */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <button 
              onClick={() => setShowManageRewards(true)}
              className="bg-[#2a2e35] hover:bg-[#32373f] rounded-xl p-5 border-2 border-yellow-600 transition text-left group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white text-lg font-bold">Rewards</h3>
                <span className="text-white text-3xl font-bold">{rewardsList.length}</span>
              </div>
              <p className="text-gray-400 text-sm">Manage reward catalog</p>
            </button>
            
            <button 
              onClick={() => setShowInventory(true)}
              className="bg-[#2a2e35] hover:bg-[#32373f] rounded-xl p-5 border-2 border-yellow-600 transition text-left group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white text-lg font-bold">Inventory</h3>
                <span className="text-white text-3xl font-bold">Stock</span>
              </div>
              <p className="text-gray-400 text-sm">Track stock levels</p>
            </button>
            
            <button 
              onClick={() => setShowAnalytics(true)}
              className="bg-[#2a2e35] hover:bg-[#32373f] rounded-xl p-5 border-2 border-yellow-600 transition text-left group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white text-lg font-bold">Analytics</h3>
                <span className="text-white text-3xl font-bold">Charts</span>
              </div>
              <p className="text-gray-400 text-sm">View insights</p>
            </button>
            
            <button 
              onClick={() => setShowActionHistory(true)}
              className="bg-[#2a2e35] hover:bg-[#32373f] rounded-xl p-5 border-2 border-yellow-600 transition text-left group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white text-lg font-bold">Audit Logs</h3>
                <span className="text-white text-3xl font-bold">Logs</span>
              </div>
              <p className="text-gray-400 text-sm">View history</p>
            </button>
          </div>
        </div>
        
        {/* Claim Requests Title */}
        <h2 className="text-2xl font-bold text-yellow-400 mb-6">Claim Requests</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div 
            className={`bg-[#23272f] rounded-lg p-6 border-2 cursor-pointer transition ${activeTab === 'pending' ? 'border-yellow-400 bg-yellow-700 bg-opacity-20' : 'border-yellow-700 hover:border-yellow-500'}`}
            onClick={() => setActiveTab('pending')}
          >
            <h3 className="text-white font-semibold mb-2 text-sm">Pending Requests</h3>
            <p className="text-3xl font-bold">{pendingCount}</p>
          </div>
          <div 
            className={`bg-[#23272f] rounded-lg p-6 border-2 cursor-pointer transition ${activeTab === 'approved' ? 'border-green-400 bg-green-700 bg-opacity-20' : 'border-yellow-700 hover:border-yellow-500'}`}
            onClick={() => setActiveTab('approved')}
          >
            <h3 className="text-white font-semibold mb-2 text-sm">Approved Requests</h3>
            <p className="text-3xl font-bold">{approvedCount}</p>
          </div>
          <div 
            className={`bg-[#23272f] rounded-lg p-6 border-2 cursor-pointer transition ${activeTab === 'processing' ? 'border-blue-400 bg-blue-700 bg-opacity-20' : 'border-yellow-700 hover:border-yellow-500'}`}
            onClick={() => setActiveTab('processing')}
          >
            <h3 className="text-white font-semibold mb-2 text-sm">Processing Requests</h3>
            <p className="text-3xl font-bold">{processingCount}</p>
          </div>
          <div 
            className={`bg-[#23272f] rounded-lg p-6 border-2 cursor-pointer transition ${activeTab === 'shipped' ? 'border-purple-400 bg-purple-700 bg-opacity-20' : 'border-yellow-700 hover:border-yellow-500'}`}
            onClick={() => setActiveTab('shipped')}
          >
            <h3 className="text-white font-semibold mb-2 text-sm">Shipped Requests</h3>
            <p className="text-3xl font-bold">{shippedCount}</p>
          </div>
          <div 
            className={`bg-[#23272f] rounded-lg p-6 border-2 cursor-pointer transition ${activeTab === 'delivered' ? 'border-cyan-400 bg-cyan-700 bg-opacity-20' : 'border-yellow-700 hover:border-yellow-500'}`}
            onClick={() => setActiveTab('delivered')}
          >
            <h3 className="text-white font-semibold mb-2 text-sm">Delivered Requests</h3>
            <p className="text-3xl font-bold">{deliveredCount}</p>
          </div>
          <div 
            className={`bg-[#23272f] rounded-lg p-6 border-2 cursor-pointer transition ${activeTab === 'rejected' ? 'border-red-400 bg-red-700 bg-opacity-20' : 'border-yellow-700 hover:border-yellow-500'}`}
            onClick={() => setActiveTab('rejected')}
          >
            <h3 className="text-red-400 font-semibold mb-2 text-sm">Rejected Requests</h3>
            <p className="text-3xl font-bold">{rejectedCount}</p>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-[#23272f] rounded-lg border border-yellow-700 overflow-hidden">
          <div className="bg-yellow-700 bg-opacity-20 px-6 py-4">
            <h2 className="text-2xl font-bold text-yellow-400">
              {activeTab === 'pending' && 'Pending Requests'}
              {activeTab === 'approved' && 'Approved Requests'}
              {activeTab === 'processing' && 'Processing Requests'}
              {activeTab === 'shipped' && 'Shipped Requests'}
              {activeTab === 'delivered' && 'Delivered Requests'}
              {activeTab === 'rejected' && 'Rejected Requests'}
            </h2>
          </div>
          
          {/* Filters */}
          <div className="px-6 py-4 bg-[#1a1d24] border-b border-yellow-700 flex gap-3">
            <input
              type="text"
              placeholder="Search by ID, Username, Name, or Reward..."
              value={requestsSearch}
              onChange={(e) => setRequestsSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
            />
            <input
              type="date"
              value={requestsFromDate}
              onChange={(e) => setRequestsFromDate(e.target.value)}
              placeholder="From Date"
              className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
            />
            <input
              type="date"
              value={requestsToDate}
              onChange={(e) => setRequestsToDate(e.target.value)}
              placeholder="To Date"
              className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-yellow-700 bg-opacity-20">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Request ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Brand Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">
                    <button
                      onClick={() => setRequestsPointsSort(curr => curr === 'asc' ? 'desc' : curr === 'desc' ? null : 'asc')}
                      className="flex items-center gap-1 hover:text-yellow-300 transition"
                    >
                      Points
                      {requestsPointsSort === 'asc' && <span>↑</span>}
                      {requestsPointsSort === 'desc' && <span>↓</span>}
                      {requestsPointsSort === null && <span className="text-gray-500">↕</span>}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Phone Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Address</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Wallet Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Wallet Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Variant</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Timestamp</th>
                  {(activeTab === 'pending' || activeTab === 'approved' || activeTab === 'processing' || activeTab === 'shipped') && <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Action</th>}
                  {activeTab === 'rejected' && <th className="px-4 py-3 text-left text-sm font-semibold text-yellow-400">Reason</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {/* Sample Row - Replace with actual data based on activeTab */}
                {(() => {
                  const filteredRequests = requests.filter(r => {
                  const matchesTab = r.status === activeTab
                  const matchesSearch = requestsSearch === '' || 
                    r.id.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                    r.username.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                    r.name.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                    r.rewardName.toLowerCase().includes(requestsSearch.toLowerCase())
                  
                  let matchesDate = true
                  if (requestsFromDate || requestsToDate) {
                    const entryDate = new Date(r.timestamp)
                    if (requestsFromDate) {
                      const fromDate = new Date(requestsFromDate)
                      matchesDate = matchesDate && entryDate >= fromDate
                    }
                    if (requestsToDate) {
                      const toDate = new Date(requestsToDate)
                      toDate.setHours(23, 59, 59, 999)
                      matchesDate = matchesDate && entryDate <= toDate
                    }
                  }
                  
                  return matchesTab && matchesSearch && matchesDate
                  })
                  
                  // Apply sorting
                  const sortedRequests = requestsPointsSort
                    ? [...filteredRequests].sort((a, b) => {
                        const pointsA = parseInt(a.points) || 0
                        const pointsB = parseInt(b.points) || 0
                        return requestsPointsSort === 'asc' ? pointsA - pointsB : pointsB - pointsA
                      })
                    : filteredRequests
                  
                  const totalRequestsPages = Math.ceil(sortedRequests.length / itemsPerPage)
                  const startIndex = (requestsPage - 1) * itemsPerPage
                  const endIndex = startIndex + itemsPerPage
                  const paginatedRequests = sortedRequests.slice(startIndex, endIndex)
                  
                  return paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-800 transition">
                    <td className="px-4 py-3 text-sm">{request.id}</td>
                    <td className="px-4 py-3 text-sm">{request.rewardName}</td>
                    <td className="px-4 py-3 text-sm">{request.points}</td>
                    <td className="px-4 py-3 text-sm">{request.username}</td>
                    <td className="px-4 py-3 text-sm">{request.name}</td>
                    <td className="px-4 py-3 text-sm">{formatPhoneNumber(request.phone)}</td>
                    <td className="px-4 py-3 text-sm">{(request as any).address || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{request.walletName}</td>
                    <td className="px-4 py-3 text-sm">{formatPhoneNumber(request.walletNumber)}</td>
                    <td className="px-4 py-3 text-sm">{(request as any).variant || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{request.timestamp}</td>
                    {activeTab === 'pending' && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                            onClick={() => handleApprove(request.id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                            onClick={() => handleRejectClick(request.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                    {activeTab === 'approved' && (
                      <td className="px-4 py-3">
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                          onClick={() => handleMoveToProcessing(request.id)}
                        >
                          Move to Processing
                        </button>
                      </td>
                    )}
                    {activeTab === 'processing' && (
                      <td className="px-4 py-3">
                        <button 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                          onClick={() => handleMoveToShipped(request.id)}
                        >
                          Move to Shipped
                        </button>
                      </td>
                    )}
                    {activeTab === 'shipped' && (
                      <td className="px-4 py-3">
                        <button 
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                          onClick={() => handleMoveToDelivered(request.id)}
                        >
                          Move to Delivered
                        </button>
                      </td>
                    )}
                    {activeTab === 'rejected' && (
                      <td className="px-4 py-3 text-sm">{request.reason || 'No reason provided'}</td>
                    )}
                  </tr>
                  ))
                })()}
                {/* Empty State */}
                {requests.filter(r => {
                  const matchesTab = r.status === activeTab
                  const matchesSearch = requestsSearch === '' || 
                    r.id.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                    r.username.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                    r.name.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                    r.rewardName.toLowerCase().includes(requestsSearch.toLowerCase())
                  
                  let matchesDate = true
                  if (requestsFromDate || requestsToDate) {
                    const entryDate = new Date(r.timestamp)
                    if (requestsFromDate) {
                      const fromDate = new Date(requestsFromDate)
                      matchesDate = matchesDate && entryDate >= fromDate
                    }
                    if (requestsToDate) {
                      const toDate = new Date(requestsToDate)
                      toDate.setHours(23, 59, 59, 999)
                      matchesDate = matchesDate && entryDate <= toDate
                    }
                  }
                  
                  return matchesTab && matchesSearch && matchesDate
                }).length === 0 && (
                  <tr>
                    <td colSpan={(activeTab === 'approved' || activeTab === 'processing' || activeTab === 'shipped' || activeTab === 'delivered') ? 12 : (activeTab === 'pending' || activeTab === 'rejected') ? 12 : 11} className="px-4 py-8 text-center text-gray-400">
                      No {activeTab} requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination for Requests */}
            {(() => {
              const filteredRequests = requests.filter(r => {
                const matchesTab = r.status === activeTab
                const matchesSearch = requestsSearch === '' || 
                  r.id.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                  r.username.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                  r.name.toLowerCase().includes(requestsSearch.toLowerCase()) ||
                  r.rewardName.toLowerCase().includes(requestsSearch.toLowerCase())
                
                let matchesDate = true
                if (requestsFromDate || requestsToDate) {
                  const entryDate = new Date(r.timestamp)
                  if (requestsFromDate) {
                    const fromDate = new Date(requestsFromDate)
                    matchesDate = matchesDate && entryDate >= fromDate
                  }
                  if (requestsToDate) {
                    const toDate = new Date(requestsToDate)
                    toDate.setHours(23, 59, 59, 999)
                    matchesDate = matchesDate && entryDate <= toDate
                  }
                }
                
                return matchesTab && matchesSearch && matchesDate
              })
              
              const totalRequestsPages = Math.ceil(filteredRequests.length / itemsPerPage)
              
              if (totalRequestsPages <= 1) return null
              
              const renderPageNumbers = () => {
                const pages = []
                const maxVisiblePages = 5
                let startPage = Math.max(1, requestsPage - Math.floor(maxVisiblePages / 2))
                let endPage = Math.min(totalRequestsPages, startPage + maxVisiblePages - 1)
                
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1)
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setRequestsPage(i)}
                      className={`min-w-[36px] h-9 px-3 rounded-lg font-semibold transition-all ${
                        requestsPage === i
                          ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/50'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {i}
                    </button>
                  )
                }
                return pages
              }
              
              return (
                <div className="flex justify-center items-center gap-2 mt-6 pb-2">
                  <button
                    onClick={() => setRequestsPage(1)}
                    disabled={requestsPage === 1}
                    className="h-9 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 text-white rounded-lg font-semibold transition-all"
                    title="First Page"
                  >
                    ⟨⟨
                  </button>
                  <button
                    onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                    disabled={requestsPage === 1}
                    className="h-9 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 text-white rounded-lg font-semibold transition-all"
                    title="Previous Page"
                  >
                    ‹ Prev
                  </button>
                  
                  <div className="flex gap-2">
                    {renderPageNumbers()}
                  </div>
                  
                  <button
                    onClick={() => setRequestsPage(p => Math.min(totalRequestsPages, p + 1))}
                    disabled={requestsPage === totalRequestsPages}
                    className="h-9 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 text-white rounded-lg font-semibold transition-all"
                    title="Next Page"
                  >
                    Next ›
                  </button>
                  <button
                    onClick={() => setRequestsPage(totalRequestsPages)}
                    disabled={requestsPage === totalRequestsPages}
                    className="h-9 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 text-white rounded-lg font-semibold transition-all"
                    title="Last Page"
                  >
                    ⟩⟩
                  </button>
                  
                  <span className="ml-3 text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
                    Page <span className="text-yellow-400 font-semibold">{requestsPage}</span> of <span className="text-yellow-400 font-semibold">{totalRequestsPages}</span>
                  </span>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Manage Rewards Popup */}
      {showManageRewards && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setShowManageRewards(false)}>
          <div className="bg-[#23272f] rounded-2xl shadow-2xl p-6 max-w-6xl w-full h-[90vh] overflow-hidden relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-2xl font-extrabold text-yellow-400">Manage Rewards</h2>
              <button className="text-gray-400 hover:text-yellow-300 text-2xl font-bold" onClick={() => setShowManageRewards(false)}>&times;</button>
            </div>
            
            <div className="flex gap-3 mb-4 items-center flex-shrink-0">
              <input
                type="text"
                placeholder="Search rewards..."
                value={rewardsSearch}
                onChange={(e) => setRewardsSearch(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400 text-sm"
              />
              
              <select
                value={rewardsCategory}
                onChange={(e) => setRewardsCategory(e.target.value)}
                className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              
              <select
                value={rewardsTier}
                onChange={(e) => setRewardsTier(e.target.value)}
                className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400 text-sm"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">🥉 Bronze</option>
                <option value="silver">🥈 Silver</option>
                <option value="gold">🥇 Gold</option>
                <option value="platinum">🏆 Platinum</option>
                <option value="diamond">💎 Diamond</option>
                <option value="black-diamond">⬛ Black Diamond</option>
              </select>
              
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg border border-yellow-600 cursor-pointer hover:border-yellow-400 transition text-sm whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={hideOutOfStock}
                  onChange={(e) => setHideOutOfStock(e.target.checked)}
                  className="w-4 h-4 accent-yellow-600 cursor-pointer"
                />
                <span>Hide Out of Stock</span>
              </label>
              
              <button 
                onClick={handleOpenAddForm}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2 whitespace-nowrap text-sm"
              >
                <span className="text-xl">+</span> Add New Reward
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Reward Cards */}
              {(() => {
                const filteredRewards = rewardsList
                  .filter(item => {
                    const matchesSearch = item.name.toLowerCase().includes(rewardsSearch.toLowerCase())
                    const matchesCategory = rewardsCategory === 'all' || (item as any).category === rewardsCategory
                    const matchesTier = rewardsTier === 'all' || (item as any).tier === rewardsTier
                    const matchesStock = !hideOutOfStock || ((item as any).quantity > 0)
                    return matchesSearch && matchesCategory && matchesTier && matchesStock
                  })
                
                const startIndex = (rewardsPage - 1) * rewardsPerPage
                const endIndex = startIndex + rewardsPerPage
                const paginatedRewards = filteredRewards.slice(startIndex, endIndex)
                
                return paginatedRewards.map((item) => {
                const images = (item as any).images || []
                const firstImage = images[0] || ''
                
                return (
                <div key={item.id} className="flex flex-col items-center rounded-2xl p-5 shadow-2xl border-2 border-yellow-400" style={{background: 'linear-gradient(180deg, #FFB300 0%, #FF9800 100%)'}}>
                  {firstImage ? (
                    <div className="w-full h-28 mb-3 rounded-xl overflow-hidden shadow-inner border border-yellow-400">
                      <img 
                        src={firstImage} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            e.currentTarget.style.display = 'none'
                            const placeholder = document.createElement('div')
                            placeholder.className = 'w-full h-full bg-yellow-200 flex items-center justify-center text-black font-bold text-sm'
                            placeholder.textContent = 'NO IMAGE'
                            parent.appendChild(placeholder)
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-28 bg-yellow-200 rounded-xl mb-3 flex items-center justify-center text-black font-bold text-sm shadow-inner border border-yellow-400">NO IMAGE</div>
                  )}
                  <div className="text-black font-extrabold text-lg mb-1 text-center truncate w-full">{item.name}</div>
                  <div className="text-black mb-0.5 text-center text-xs italic">Model: <span className="text-yellow-900 font-semibold">{(item as any).model || 'N/A'}</span></div>
                  <div className="text-black mb-0.5 text-center font-medium text-sm">Points: <span className="text-yellow-900 font-bold">{item.points}</span></div>
                  <div className="text-black mb-0.5 text-center text-sm">Category: <span className="text-yellow-900 font-semibold">{(item as any).category || 'N/A'}</span></div>
                  <div className="text-black mb-2 text-center text-sm">Quantity: <span className="text-yellow-900 font-semibold">{(item as any).quantity || 0}</span></div>
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-bold shadow transition text-sm"
                      onClick={() => handleOpenEditForm(item)}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-bold shadow transition text-sm"
                      onClick={() => handleDeleteReward(item.id)}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              )
              })
            })()}
              </div>
            </div>
            
            {/* Pagination Controls for Manage Rewards */}
            {(() => {
              const filteredRewards = rewardsList
                .filter(item => {
                  const matchesSearch = item.name.toLowerCase().includes(rewardsSearch.toLowerCase())
                  const matchesCategory = rewardsCategory === 'all' || (item as any).category === rewardsCategory
                  const matchesTier = rewardsTier === 'all' || (item as any).tier === rewardsTier
                  return matchesSearch && matchesCategory && matchesTier
                })
              const totalPages = Math.ceil(filteredRewards.length / rewardsPerPage)
              
              if (totalPages <= 1) return null
              
              return (
                <div className="flex justify-center items-center gap-2 mt-3 flex-shrink-0">
                  <button
                    onClick={() => setRewardsPage(prev => Math.max(1, prev - 1))}
                    disabled={rewardsPage === 1}
                    className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-yellow-100 text-sm">
                    Page {rewardsPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setRewardsPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={rewardsPage === totalPages}
                    className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Inventory Popup */}
      {showInventory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setShowInventory(false)}>
          <div className="bg-[#23272f] rounded-2xl shadow-2xl p-6 max-w-6xl w-full h-[90vh] overflow-hidden relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-extrabold text-yellow-400">Inventory Management</h2>
              <button className="text-gray-400 hover:text-yellow-300 text-2xl font-bold" onClick={() => setShowInventory(false)}>&times;</button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4 border-b border-yellow-700 pb-2">
              <button
                onClick={() => setInventoryTab('restock')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition ${inventoryTab === 'restock' ? 'bg-yellow-700 text-yellow-100' : 'text-yellow-400 hover:bg-yellow-900'}`}
              >
                Restock Rewards
              </button>
              <button
                onClick={() => setInventoryTab('history')}
                className={`px-4 py-2 rounded-t-lg font-semibold transition ${inventoryTab === 'history' ? 'bg-yellow-700 text-yellow-100' : 'text-yellow-400 hover:bg-yellow-900'}`}
              >
                Restocking History
              </button>
            </div>
            
            {/* Restock Rewards Tab */}
            {inventoryTab === 'restock' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Filters */}
                <div className="flex gap-3 mb-3 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search rewards..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
                  />
                  <select
                    value={inventoryCategory}
                    onChange={(e) => setInventoryCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={downloadCSV}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download CSV
                  </button>
                </div>
                
                <table className="bg-[#1a1d24] rounded-lg overflow-hidden flex-1 w-full flex flex-col">
                    <thead className="bg-yellow-700 flex-shrink-0">
                      <tr className="flex">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Brand Name</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Item Model</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Category</th>
                        <th 
                          className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 cursor-pointer hover:bg-yellow-600 flex-1 transition"
                          onClick={() => {
                            if (stockSort === 'none') setStockSort('asc')
                            else if (stockSort === 'asc') setStockSort('desc')
                            else setStockSort('none')
                          }}
                        >
                          <span className="flex items-center gap-1">
                            Current Stock
                            {stockSort === 'asc' && <span>↑</span>}
                            {stockSort === 'desc' && <span>↓</span>}
                            {stockSort === 'none' && <span className="text-yellow-400/50">↕</span>}
                          </span>
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Restock</th>
                      </tr>
                    </thead>
                    <tbody className="flex flex-col flex-1">
                      {(() => {
                        const filteredRewards = rewardsList
                          .filter(reward => {
                            const matchesSearch = reward.name.toLowerCase().includes(inventorySearch.toLowerCase())
                            const matchesCategory = inventoryCategory === 'all' || (reward as any).category === inventoryCategory
                            return matchesSearch && matchesCategory
                          })
                          .sort((a, b) => {
                            if (stockSort === 'none') return 0
                            const qtyA = (a as any).quantity || 0
                            const qtyB = (b as any).quantity || 0
                            return stockSort === 'asc' ? qtyA - qtyB : qtyB - qtyA
                          })
                        
                        const startIndex = (restockPage - 1) * itemsPerPage
                        const endIndex = startIndex + itemsPerPage
                        const paginatedRewards = filteredRewards.slice(startIndex, endIndex)
                        
                        return paginatedRewards.map((reward) => {
                          const quantity = (reward as any).quantity || 0
                          const isLowStock = quantity <= 3
                          
                          return (
                            <tr key={reward.id} className="border-b border-gray-700 hover:bg-gray-800 flex items-center">
                              <td className="px-4 py-2 text-yellow-100 text-sm flex-1">{reward.name}</td>
                              <td className="px-4 py-2 text-gray-400 text-sm flex-1">{(reward as any).model || 'N/A'}</td>
                              <td className="px-4 py-2 text-yellow-100 text-sm flex-1">{(reward as any).category || 'N/A'}</td>
                              <td className={`px-4 py-2 text-sm flex-1 ${isLowStock ? 'text-red-500 font-semibold' : 'text-yellow-100'}`}>
                                <span className={isLowStock ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}>
                                  {quantity}
                                </span>
                              </td>
                              <td className="px-4 py-2 flex-1">
                                <input 
                                  type="number" 
                                  min="0" 
                                  placeholder="Add quantity"
                                  value={restockQuantities[reward.id] || ''}
                                  onChange={(e) => setRestockQuantities(prev => ({ ...prev, [reward.id]: e.target.value }))}
                                  className="w-24 px-2 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
                                />
                                <button 
                                  onClick={() => handleRestockUpdate(reward.id)}
                                  className="ml-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold"
                                >
                                  Update
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                </table>
                
                {/* Pagination Controls for Restock Tab */}
                {(() => {
                  const filteredRewards = rewardsList
                    .filter(reward => {
                      const matchesSearch = reward.name.toLowerCase().includes(inventorySearch.toLowerCase())
                      const matchesCategory = inventoryCategory === 'all' || (reward as any).category === inventoryCategory
                      return matchesSearch && matchesCategory
                    })
                  const totalPages = Math.ceil(filteredRewards.length / itemsPerPage)
                  
                  if (totalPages <= 1) return null
                  
                  return (
                    <div className="flex justify-center items-center gap-2 mt-3 flex-shrink-0">
                      <button
                        onClick={() => setRestockPage(prev => Math.max(1, prev - 1))}
                        disabled={restockPage === 1}
                        className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Previous
                      </button>
                      <span className="text-yellow-100 text-sm">
                        Page {restockPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setRestockPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={restockPage === totalPages}
                        className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}
            
            {/* Restocking History Tab */}
            
            {/* Restocking History Tab */}
            {inventoryTab === 'history' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Filters */}
                <div className="flex gap-3 mb-3 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search rewards..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
                  />
                  <input
                    type="date"
                    value={historyFromDate}
                    onChange={(e) => setHistoryFromDate(e.target.value)}
                    placeholder="From Date"
                    className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
                  />
                  <input
                    type="date"
                    value={historyToDate}
                    onChange={(e) => setHistoryToDate(e.target.value)}
                    placeholder="To Date"
                    className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
                  />
                  <select
                    value={historyCategory}
                    onChange={(e) => setHistoryCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={downloadHistoryCSV}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download CSV
                  </button>
                </div>

                <table className="bg-[#1a1d24] rounded-lg overflow-hidden flex-1 w-full flex flex-col">
                    <thead className="bg-yellow-700 flex-shrink-0">
                      <tr className="flex">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Date</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Brand Name</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Item Model</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Category</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Quantity Added</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100 flex-1">Admin</th>
                      </tr>
                    </thead>
                    <tbody className="flex flex-col flex-1">
                      {(() => {
                        const filteredHistory = restockingHistory
                          .filter(entry => {
                            const matchesSearch = entry.rewardName.toLowerCase().includes(historySearch.toLowerCase())
                            const matchesCategory = historyCategory === 'all' || entry.category === historyCategory
                            
                            let matchesDate = true
                            if (historyFromDate || historyToDate) {
                              const entryDate = new Date(entry.date)
                              if (historyFromDate) {
                                const fromDate = new Date(historyFromDate)
                                matchesDate = matchesDate && entryDate >= fromDate
                              }
                              if (historyToDate) {
                                const toDate = new Date(historyToDate)
                                toDate.setHours(23, 59, 59, 999)
                                matchesDate = matchesDate && entryDate <= toDate
                              }
                            }
                            
                            return matchesSearch && matchesCategory && matchesDate
                          })
                        
                        if (filteredHistory.length === 0) {
                          return (
                            <tr className="border-b border-gray-700 flex items-center">
                              <td className="px-4 py-2 text-gray-400 text-sm flex-1" colSpan={6}>No restocking history yet</td>
                            </tr>
                          )
                        }
                        
                        const startIndex = (historyPage - 1) * itemsPerPage
                        const endIndex = startIndex + itemsPerPage
                        const paginatedHistory = filteredHistory.slice(startIndex, endIndex)
                        
                        return paginatedHistory.map((entry, index) => (
                          <tr key={index} className="border-b border-gray-700 flex items-center">
                            <td className="px-4 py-2 text-yellow-100 text-sm flex-1">{entry.date}</td>
                            <td className="px-4 py-2 text-yellow-100 text-sm flex-1">{entry.rewardName}</td>
                            <td className="px-4 py-2 text-gray-400 text-sm flex-1">{entry.model || 'N/A'}</td>
                            <td className="px-4 py-2 text-yellow-100 text-sm flex-1">{entry.category}</td>
                            <td className="px-4 py-2 text-yellow-100 text-sm flex-1">+{entry.quantityAdded}</td>
                            <td className="px-4 py-2 text-yellow-100 text-sm flex-1">{entry.admin}</td>
                          </tr>
                        ))
                      })()}
                  </tbody>
                </table>
              
              {/* Pagination Controls for History Tab */}
              {(() => {
                const filteredHistory = restockingHistory
                  .filter(entry => {
                    const matchesSearch = entry.rewardName.toLowerCase().includes(historySearch.toLowerCase())
                    const matchesCategory = historyCategory === 'all' || entry.category === historyCategory
                    
                    let matchesDate = true
                    if (historyFromDate || historyToDate) {
                      const entryDate = new Date(entry.date)
                      if (historyFromDate) {
                        const fromDate = new Date(historyFromDate)
                        matchesDate = matchesDate && entryDate >= fromDate
                      }
                      if (historyToDate) {
                        const toDate = new Date(historyToDate)
                        toDate.setHours(23, 59, 59, 999)
                        matchesDate = matchesDate && entryDate <= toDate
                      }
                    }
                    
                    return matchesSearch && matchesCategory && matchesDate
                  })
                const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
                
                if (totalPages <= 1) return null
                
                return (
                  <div className="flex justify-center items-center gap-2 mt-3 flex-shrink-0">
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                      disabled={historyPage === 1}
                      className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-yellow-100 text-sm">
                      Page {historyPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={historyPage === totalPages}
                      className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                  </div>
                )
              })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Popup */}
      {showAnalytics && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setShowAnalytics(false)}>
          <div className="bg-[#23272f] rounded-2xl shadow-2xl p-4 max-w-7xl w-full h-[90vh] overflow-hidden relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-extrabold text-yellow-400">Analytics & Reports</h2>
              <button className="text-gray-400 hover:text-yellow-300 text-2xl font-bold" onClick={() => setShowAnalytics(false)}>&times;</button>
            </div>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-[#1a1d24] rounded-lg p-2 border border-yellow-700">
                <h4 className="text-yellow-400 text-xs font-semibold mb-0.5">Total Claims</h4>
                <p className="text-xl font-bold text-yellow-100">{requests.length}</p>
              </div>
              <div className="bg-[#1a1d24] rounded-lg p-2 border border-yellow-700">
                <h4 className="text-yellow-400 text-xs font-semibold mb-0.5"># of Delivered</h4>
                <p className="text-xl font-bold text-yellow-100">{requests.filter(r => r.status === 'delivered').length}</p>
              </div>
              <div className="bg-[#1a1d24] rounded-lg p-2 border border-yellow-700">
                <h4 className="text-yellow-400 text-xs font-semibold mb-0.5">Delivery Rate</h4>
                <p className="text-xl font-bold text-yellow-100">
                  {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'delivered').length / requests.length) * 100) : 0}%
                </p>
              </div>
              <div className="bg-[#1a1d24] rounded-lg p-2 border border-yellow-700">
                <h4 className="text-yellow-400 text-xs font-semibold mb-0.5">Total Points (Delivered)</h4>
                <p className="text-xl font-bold text-yellow-100">
                  {requests.filter(r => r.status === 'delivered').reduce((sum, r) => sum + r.points, 0)}
                </p>
              </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
              <div className="bg-gradient-to-br from-[#1a1d24] to-[#23272f] rounded-xl p-3 border-2 border-yellow-600 shadow-lg overflow-y-auto">
                <h4 className="text-yellow-400 font-bold text-base mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Popular Rewards
                </h4>
                <div className="space-y-3">
                  {Object.entries(
                    requests.reduce((acc, r) => {
                      acc[r.rewardName] = (acc[r.rewardName] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  )
                  .sort(([,a], [,b]): number => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([name, count], index) => {
                    const countValue = count as number
                    const maxCount = Math.max(...(Object.values(
                      requests.reduce((acc, r) => {
                        acc[r.rewardName] = (acc[r.rewardName] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ) as number[]))
                    const percentage = (countValue / maxCount) * 100
                    const colors = [
                      'from-green-500 to-emerald-400',
                      'from-blue-500 to-cyan-400',
                      'from-purple-500 to-pink-400',
                      'from-yellow-500 to-orange-400',
                      'from-red-500 to-rose-400'
                    ]
                    return (
                      <div key={name} className="group">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-yellow-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-yellow-50 text-xs font-semibold truncate max-w-[150px]">{name}</span>
                          </div>
                          <span className="text-yellow-400 text-sm font-bold">{countValue}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-lg h-6 overflow-hidden shadow-inner">
                          <div 
                            className={`bg-gradient-to-r ${colors[index]} h-6 rounded-lg flex items-center justify-end pr-2 transition-all duration-700 ease-out shadow-lg group-hover:shadow-2xl group-hover:scale-x-[1.02] origin-left`}
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-bold drop-shadow-lg">{Math.round(percentage)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#1a1d24] to-[#23272f] rounded-xl p-3 border-2 border-yellow-600 shadow-lg overflow-hidden flex flex-col">
                <h4 className="text-yellow-400 font-bold text-base mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  Popular Categories
                </h4>
                {(() => {
                  const categoryData = Object.entries(
                    rewardsList.reduce((acc, r) => {
                      const cat = (r as any).category || 'Uncategorized'
                      acc[cat] = (acc[cat] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).sort(([,a], [,b]): number => (b as number) - (a as number))
                  
                  const total = categoryData.reduce((sum, [, count]) => sum + (count as number), 0)
                  const colors = [
                    { bg: '#10b981', border: '#059669' },
                    { bg: '#3b82f6', border: '#2563eb' },
                    { bg: '#8b5cf6', border: '#7c3aed' },
                    { bg: '#f59e0b', border: '#d97706' },
                    { bg: '#ef4444', border: '#dc2626' },
                    { bg: '#06b6d4', border: '#0891b2' },
                    { bg: '#ec4899', border: '#db2777' }
                  ]
                  
                  let currentAngle = 0
                  const slices = categoryData.map(([category, count], index) => {
                    const percentage = ((count as number) / total) * 100
                    const angle = ((count as number) / total) * 360
                    const startAngle = currentAngle
                    currentAngle += angle
                    
                    return {
                      category,
                      count,
                      percentage,
                      startAngle,
                      angle,
                      color: colors[index % colors.length]
                    }
                  })
                  
                  const createArc = (startAngle: number, endAngle: number, radius: number = 80) => {
                    const start = polarToCartesian(100, 100, radius, endAngle)
                    const end = polarToCartesian(100, 100, radius, startAngle)
                    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
                    
                    return [
                      'M', 100, 100,
                      'L', start.x, start.y,
                      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                      'Z'
                    ].join(' ')
                  }
                  
                  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
                    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180
                    return {
                      x: centerX + (radius * Math.cos(angleInRadians)),
                      y: centerY + (radius * Math.sin(angleInRadians))
                    }
                  }
                  
                  return (
                    <div className="flex flex-col items-center flex-1 overflow-hidden">
                      <div className="relative flex-1 w-full flex items-center justify-center min-h-0 py-2">
                        <svg viewBox="0 0 200 200" className="w-[70%] h-[70%] max-w-full max-h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
                          {slices.map((slice, index) => (
                            <g key={slice.category} className="group cursor-pointer">
                              <path
                                d={createArc(slice.startAngle, slice.startAngle + slice.angle)}
                                fill={slice.color.bg}
                                stroke={slice.color.border}
                                strokeWidth="2"
                                className="transition-all duration-300 hover:opacity-80"
                                style={{
                                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                                  transformOrigin: '100px 100px',
                                }}
                              />
                              <text
                                x={polarToCartesian(100, 100, 60, slice.startAngle + slice.angle / 2).x}
                                y={polarToCartesian(100, 100, 60, slice.startAngle + slice.angle / 2).y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-white font-bold text-xs pointer-events-none"
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                              >
                                {Math.round(slice.percentage)}%
                              </text>
                            </g>
                          ))}
                          <circle cx="100" cy="100" r="35" fill="#1a1d24" stroke="#374151" strokeWidth="2" />
                          <text x="100" y="95" textAnchor="middle" className="fill-yellow-400 font-bold text-xs">Total</text>
                          <text x="100" y="108" textAnchor="middle" className="fill-yellow-200 font-bold text-base">{total}</text>
                        </svg>
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5 justify-center w-full px-2" style={{ maxHeight: '55px', overflow: 'hidden' }}>
                        {slices.map((slice, index) => (
                          <div key={slice.category} className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-sm shadow-lg flex-shrink-0"
                              style={{ 
                                background: `linear-gradient(135deg, ${slice.color.bg}, ${slice.color.border})`,
                                boxShadow: `0 0 6px ${slice.color.bg}40`
                              }}
                            />
                            <span className="text-yellow-50 font-semibold text-sm">{slice.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action History Popup */}
      {showActionHistory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setShowActionHistory(false)}>
          <div className="bg-[#23272f] rounded-2xl shadow-2xl p-6 max-w-6xl w-full h-[90vh] overflow-hidden relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-extrabold text-yellow-400">Action History / Audit Logs</h2>
              <button className="text-gray-400 hover:text-yellow-300 text-2xl font-bold" onClick={() => setShowActionHistory(false)}>&times;</button>
            </div>
            
            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-shrink-0">
              <input
                type="text"
                placeholder="Search Claim ID..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
              />
              <input
                type="date"
                value={auditFromDate}
                onChange={(e) => setAuditFromDate(e.target.value)}
                placeholder="From Date"
                className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
              />
              <input
                type="date"
                value={auditToDate}
                onChange={(e) => setAuditToDate(e.target.value)}
                placeholder="To Date"
                className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
              />
              <select
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
                className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
              >
                <option value="all">All Actions</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={auditAdmin}
                onChange={(e) => setAuditAdmin(e.target.value)}
                className="px-3 py-2 bg-gray-800 text-yellow-100 rounded-lg border border-yellow-700 focus:outline-none focus:border-yellow-400 text-sm"
              >
                <option value="all">All Admins</option>
                {(() => {
                  const uniqueAdmins = Array.from(new Set(
                    requests
                      .filter(r => r.status !== 'pending' && (r as any).adminUser)
                      .map(r => (r as any).adminUser)
                  ))
                  return uniqueAdmins.map(admin => (
                    <option key={admin} value={admin}>{admin}</option>
                  ))
                })()}
              </select>
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden">
              <table className="bg-[#1a1d24] rounded-lg overflow-hidden w-full flex flex-col flex-1">
                <thead className="bg-yellow-700 flex-shrink-0">
                  <tr className="flex">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100" style={{width: '20%'}}>Timestamp</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100" style={{width: '15%'}}>Action</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100" style={{width: '20%'}}>Request ID</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100" style={{width: '30%'}}>Details</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-yellow-100" style={{width: '15%'}}>Admin</th>
                  </tr>
                </thead>
                <tbody className="flex flex-col flex-1">
                    {(() => {
                    const filteredLogs = requests
                      .filter(r => {
                        const matchesStatus = r.status !== 'pending'
                        const matchesSearch = auditSearch === '' || r.id.toLowerCase().includes(auditSearch.toLowerCase())
                        const matchesAction = auditAction === 'all' || r.status === auditAction
                        const matchesAdmin = auditAdmin === 'all' || (r as any).adminUser === auditAdmin
                        
                        let matchesDate = true
                        if (auditFromDate || auditToDate) {
                          const entryDate = new Date(r.timestamp)
                          if (auditFromDate) {
                            const fromDate = new Date(auditFromDate)
                            matchesDate = matchesDate && entryDate >= fromDate
                          }
                          if (auditToDate) {
                            const toDate = new Date(auditToDate)
                            toDate.setHours(23, 59, 59, 999)
                            matchesDate = matchesDate && entryDate <= toDate
                          }
                        }
                        
                        return matchesStatus && matchesSearch && matchesAction && matchesAdmin && matchesDate
                      })
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    
                    const startIndex = (auditPage - 1) * itemsPerPage
                    const endIndex = startIndex + itemsPerPage
                    const paginatedLogs = filteredLogs.slice(startIndex, endIndex)
                    
                    return paginatedLogs.map((request) => (
                      <tr key={request.id} className="border-b border-gray-700 hover:bg-gray-800 flex items-center h-10 flex-shrink-0">
                        <td className="px-4 py-2 text-yellow-100 text-sm text-left" style={{width: '20%'}}>{request.timestamp}</td>
                        <td className="px-4 py-2 text-left" style={{width: '15%'}}>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            request.status === 'approved' ? 'bg-green-700 text-green-100' :
                            request.status === 'processing' ? 'bg-blue-700 text-blue-100' :
                            request.status === 'shipped' ? 'bg-purple-700 text-purple-100' :
                            request.status === 'delivered' ? 'bg-cyan-700 text-cyan-100' :
                            'bg-red-700 text-red-100'
                          }`}>
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-yellow-100 text-sm text-left" style={{width: '20%'}}>{request.id}</td>
                        <td className="px-4 py-2 text-yellow-100 text-sm text-left" style={{width: '30%'}}>{request.rewardName} - {request.username}</td>
                        <td className="px-4 py-2 text-yellow-100 text-sm text-left" style={{width: '15%'}}>{(request as any).adminUser || 'N/A'}</td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls for Audit Logs */}
            {(() => {
              const filteredLogs = requests
                .filter(r => {
                  const matchesStatus = r.status !== 'pending'
                  const matchesSearch = auditSearch === '' || r.id.toLowerCase().includes(auditSearch.toLowerCase())
                  const matchesAction = auditAction === 'all' || r.status === auditAction
                  const matchesAdmin = auditAdmin === 'all' || auditAdmin === 'Admin'
                  
                  let matchesDate = true
                  if (auditFromDate || auditToDate) {
                    const entryDate = new Date(r.timestamp)
                    if (auditFromDate) {
                      const fromDate = new Date(auditFromDate)
                      matchesDate = matchesDate && entryDate >= fromDate
                    }
                    if (auditToDate) {
                      const toDate = new Date(auditToDate)
                      toDate.setHours(23, 59, 59, 999)
                      matchesDate = matchesDate && entryDate <= toDate
                    }
                  }
                  
                  return matchesStatus && matchesSearch && matchesAction && matchesAdmin && matchesDate
                })
              const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
              
              if (totalPages <= 1) return null
              
              return (
                <div className="flex justify-center items-center gap-2 mt-3 flex-shrink-0">
                  <button
                    onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                    disabled={auditPage === 1}
                    className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-yellow-100 text-sm">
                    Page {auditPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setAuditPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={auditPage === totalPages}
                    className="px-3 py-1 bg-gray-800 text-yellow-100 rounded border border-yellow-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* New Reward Form Modal */}
      {showRewardForm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-90" onClick={() => setShowRewardForm(false)}>
          <div className="bg-[#1a1d24] rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative border-2 border-yellow-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-extrabold text-yellow-400">{formMode === 'add' ? 'Add New Reward' : 'Edit Reward'}</h2>
              <button className="text-gray-400 hover:text-yellow-300 text-3xl font-bold" onClick={() => setShowRewardForm(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitRewardForm} className="space-y-6">
              {/* Gallery Upload Section */}
              <div className="bg-[#23272f] p-6 rounded-lg border border-yellow-600">
                <h3 className="text-yellow-400 font-bold text-lg mb-4">📸 Gallery Images</h3>
                <p className="text-gray-400 text-sm mb-4">Upload up to 4 images for this reward</p>
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((imgIndex) => {
                    const img = formData.images[imgIndex]
                    const hasImage = img && typeof img === 'object' || (typeof img === 'string' && img.length > 0)
                    const previewUrl = hasImage ? (typeof img === 'string' ? img : URL.createObjectURL(img as File)) : null
                    
                    return (
                      <div key={imgIndex} className="relative">
                        <label className="block text-gray-300 font-medium text-sm mb-2">Image {imgIndex + 1}</label>
                        {previewUrl ? (
                          <div className="relative group">
                            <img 
                              src={previewUrl} 
                              alt={`Preview ${imgIndex + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-600"
                              onError={(e) => e.currentTarget.style.display = 'none'} 
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`file-input-${imgIndex}`) as HTMLInputElement
                                  input?.click()
                                }}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition"
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => handleImageChange(imgIndex, '')}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(`file-input-${imgIndex}`) as HTMLInputElement
                              input?.click()
                            }}
                            className="w-full h-32 border-2 border-dashed border-gray-600 hover:border-yellow-500 rounded-lg flex flex-col items-center justify-center gap-2 bg-[#1a1d24] hover:bg-[#2a2e36] transition-colors group"
                          >
                            <svg className="w-8 h-8 text-gray-500 group-hover:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-gray-400 group-hover:text-yellow-400 text-xs font-medium transition-colors">
                              Click to upload
                            </span>
                          </button>
                        )}
                        <input
                          id={`file-input-${imgIndex}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageChange(imgIndex, file)
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-yellow-400 font-semibold mb-2">Brand Name *</label>
                <input
                  type="text"
                  placeholder="Enter brand name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#23272f] text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              {/* Item Model */}
              <div>
                <label className="block text-yellow-400 font-semibold mb-2">Item Model</label>
                <input
                  type="text"
                  placeholder="Enter item model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="w-full px-4 py-3 bg-[#23272f] text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400"
                />
              </div>

              {/* Reward Description */}
              <div>
                <label className="block text-yellow-400 font-semibold mb-2">Reward Details</label>
                <textarea
                  placeholder="Enter reward description or details"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-[#23272f] text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400 min-h-[100px]"
                />
              </div>

              {/* Category with Add Function */}
              <div>
                <label className="block text-yellow-400 font-semibold mb-2">Category *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="flex-1 px-4 py-3 bg-[#23272f] text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {!showAddCategory ? (
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New category"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="px-3 py-2 bg-[#23272f] text-white rounded-lg border border-green-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Points */}
              <div>
                <label className="block text-yellow-400 font-semibold mb-2">Points *</label>
                <input
                  type="number"
                  placeholder="Enter points required"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: e.target.value})}
                  className="w-full px-4 py-3 bg-[#23272f] text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              {/* Discount Section */}
              <div className="bg-[#23272f] p-6 rounded-lg border border-purple-600">
                <h3 className="text-purple-400 font-bold text-lg mb-4">🏷️ Limited Time Discount</h3>
                <p className="text-gray-400 text-sm mb-4">Set a temporary discount for this reward</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Discounted Price */}
                  <div>
                    <label className="block text-purple-300 font-medium mb-2">Discounted Price</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 400"
                      value={formData.discounted_price}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({...formData, discounted_price: value})
                      }}
                      className="w-full px-4 py-3 bg-[#1a1d24] text-white rounded-lg border border-purple-500 focus:outline-none focus:border-purple-300"
                    />
                    <p className="text-gray-500 text-xs mt-1">Leave empty for no discount</p>
                  </div>
                  
                  {/* Discount End Date */}
                  <div>
                    <label className="block text-purple-300 font-medium mb-2">Expires On</label>
                    <input
                      type="datetime-local"
                      value={formData.discount_end_date}
                      onChange={(e) => setFormData({...formData, discount_end_date: e.target.value})}
                      className="w-full px-4 py-3 bg-[#1a1d24] text-white rounded-lg border border-purple-500 focus:outline-none focus:border-purple-300"
                    />
                    <p className="text-gray-500 text-xs mt-1">Leave empty for no expiry</p>
                  </div>
                </div>
                {formData.discounted_price && parseInt(formData.discounted_price) > 0 && formData.points && parseInt(formData.discounted_price) < parseInt(formData.points) && (
                  <div className="mt-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                    <p className="text-purple-200 text-sm font-semibold">Preview:</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-gray-400 line-through text-lg">{formData.points} pts</span>
                      <span className="text-2xl font-bold text-purple-400">
                        {formData.discounted_price} pts
                      </span>
                      <span className="text-green-400 font-semibold">
                        (-{Math.round((1 - parseInt(formData.discounted_price) / parseInt(formData.points)) * 100)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-yellow-400 font-semibold mb-2">Prestige Tier *</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({...formData, tier: e.target.value})}
                  className="w-full px-4 py-3 bg-[#23272f] text-white rounded-lg border border-yellow-600 focus:outline-none focus:border-yellow-400"
                  required
                >
                  <option value="bronze">🥉 Bronze - Entry Level</option>
                  <option value="silver">🥈 Silver - Mid Range</option>
                  <option value="gold">🥇 Gold - Premium</option>
                  <option value="platinum">🏆 Platinum - Elite</option>
                  <option value="diamond">💎 Diamond - Luxury</option>
                  <option value="black-diamond">⬛ Black Diamond - Ultra Exclusive</option>
                </select>
                <p className="text-gray-400 text-xs mt-2">Select the prestige tier for this reward card</p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-bold text-lg shadow-lg transition"
                >
                  {formMode === 'add' ? 'Create Reward' : 'Update Reward'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRewardForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-bold text-lg shadow-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      
      {/* Reject Reason Popup */}
      {showRejectPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80" onClick={handleRejectCancel}>
          <div className="bg-[#23272f] rounded-2xl shadow-2xl p-8 max-w-md w-full relative border-2 border-red-400" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-red-400">Reject Request</h2>
              <button className="text-gray-400 hover:text-red-300 text-2xl font-bold" onClick={handleRejectCancel}>&times;</button>
            </div>
            
            <form onSubmit={handleRejectSubmit}>
              <label className="block text-yellow-100 text-sm font-semibold mb-2">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 text-yellow-100 rounded-lg border border-red-400 focus:outline-none focus:border-red-300 resize-none"
                rows={4}
                placeholder="Enter the reason for rejecting this request..."
                required
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow transition"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold shadow transition"
                  onClick={handleRejectCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showPasswordVerification && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black bg-opacity-75" onClick={() => {
          setShowPasswordVerification(false)
          setVerificationPassword('')
        }}>
          <div className="bg-gradient-to-br from-red-900 via-gray-900 to-black rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-red-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="text-2xl font-extrabold text-red-400 mb-4 text-center">Verify Password</h2>
              <p className="text-yellow-100 text-center mb-6 leading-relaxed">
                Please enter your password to confirm deletion.
              </p>
              <input
                type="password"
                value={verificationPassword}
                onChange={(e) => setVerificationPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerifiedDelete()}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-red-600 focus:outline-none focus:border-red-400 mb-6"
                autoFocus
              />
              <div className="flex gap-3 w-full">
                <button
                  onClick={handlePasswordVerifiedDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition"
                >
                  CONFIRM
                </button>
                <button
                  onClick={() => {
                    setShowPasswordVerification(false)
                    setVerificationPassword('')
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteWarning && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-75" onClick={() => setShowDeleteWarning(false)}>
          <div className="bg-gradient-to-br from-yellow-900 via-gray-900 to-black rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-yellow-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-extrabold text-yellow-400 mb-4 text-center">Warning!</h2>
              <p className="text-yellow-100 text-center mb-6 leading-relaxed">
                Are you sure you want to delete this reward? There are {deleteWarningData.claimCount} claim(s) associated with this reward.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition"
                >
                  YES
                </button>
                <button
                  onClick={() => setShowDeleteWarning(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition"
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showErrorModal && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black bg-opacity-75" onClick={() => setShowErrorModal(false)}>
          <div className="bg-gradient-to-br from-red-900 via-gray-900 to-black rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-red-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-extrabold text-red-400 mb-4 text-center">Error</h2>
              <p className="text-yellow-100 text-center mb-6 leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Settings Modal */}
      {showBannerSettings && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={() => setShowBannerSettings(false)}>
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-extrabold text-yellow-400">Banner Settings</h2>
              <button
                onClick={() => setShowBannerSettings(false)}
                className="text-gray-400 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-700">
              <button
                onClick={() => setBannerSettingsTab('top')}
                className={`px-6 py-3 font-semibold transition relative ${
                  bannerSettingsTab === 'top'
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Top Banner
                {bannerSettingsTab === 'top' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t" />
                )}
              </button>
              <button
                onClick={() => setBannerSettingsTab('bottom')}
                className={`px-6 py-3 font-semibold transition relative ${
                  bannerSettingsTab === 'bottom'
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Bottom Banner
                {bannerSettingsTab === 'bottom' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {bannerSettingsTab === 'top' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Top Banner Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2 font-semibold">Banner Image</label>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setTopBannerImage(file)
                            }}
                            className="hidden"
                            id="topBannerUpload"
                          />
                          <label
                            htmlFor="topBannerUpload"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:border-yellow-500 cursor-pointer transition"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="font-semibold">Upload Banner Image</span>
                          </label>
                        </div>
                        {topBannerImage && (
                          <div className="relative rounded-lg overflow-hidden border-2 border-gray-600">
                            <img
                              src={typeof topBannerImage === 'string' ? topBannerImage : URL.createObjectURL(topBannerImage)}
                              alt="Top Banner Preview"
                              className="w-full h-32 object-cover"
                            />
                            <button
                              onClick={() => setTopBannerImage('')}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-2">Current: /Bannertop.png</p>
                    </div>
                  </div>
                </div>
              )}

              {bannerSettingsTab === 'bottom' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Bottom Banner Carousel Configuration</h3>
                  <div className="space-y-6">
                    {/* Banner 1 */}
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-3">Banner 1</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-300 mb-2">Image</label>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setBottomBanner1Image(file)
                              }}
                              className="hidden"
                              id="bottomBanner1Upload"
                            />
                            <label
                              htmlFor="bottomBanner1Upload"
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 hover:bg-gray-500 hover:border-yellow-500 cursor-pointer transition text-sm"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span>Upload Image</span>
                            </label>
                            {bottomBanner1Image && (
                              <div className="relative rounded overflow-hidden border border-gray-500">
                                <img
                                  src={typeof bottomBanner1Image === 'string' ? bottomBanner1Image : URL.createObjectURL(bottomBanner1Image)}
                                  alt="Banner 1"
                                  className="w-full h-20 object-cover"
                                />
                                <button
                                  onClick={() => setBottomBanner1Image('')}
                                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">Link URL</label>
                          <input
                            type="text"
                            placeholder="https://example.com"
                            value={bottomBanner1Link}
                            onChange={(e) => setBottomBanner1Link(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Banner 2 */}
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-3">Banner 2</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-300 mb-2">Image</label>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setBottomBanner2Image(file)
                              }}
                              className="hidden"
                              id="bottomBanner2Upload"
                            />
                            <label
                              htmlFor="bottomBanner2Upload"
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 hover:bg-gray-500 hover:border-yellow-500 cursor-pointer transition text-sm"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span>Upload Image</span>
                            </label>
                            {bottomBanner2Image && (
                              <div className="relative rounded overflow-hidden border border-gray-500">
                                <img
                                  src={typeof bottomBanner2Image === 'string' ? bottomBanner2Image : URL.createObjectURL(bottomBanner2Image)}
                                  alt="Banner 2"
                                  className="w-full h-20 object-cover"
                                />
                                <button
                                  onClick={() => setBottomBanner2Image('')}
                                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">Link URL</label>
                          <input
                            type="text"
                            placeholder="https://example.com"
                            value={bottomBanner2Link}
                            onChange={(e) => setBottomBanner2Link(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Banner 3 */}
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-3">Banner 3</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-300 mb-2">Image</label>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) setBottomBanner3Image(file)
                              }}
                              className="hidden"
                              id="bottomBanner3Upload"
                            />
                            <label
                              htmlFor="bottomBanner3Upload"
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 hover:bg-gray-500 hover:border-yellow-500 cursor-pointer transition text-sm"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span>Upload Image</span>
                            </label>
                            {bottomBanner3Image && (
                              <div className="relative rounded overflow-hidden border border-gray-500">
                                <img
                                  src={typeof bottomBanner3Image === 'string' ? bottomBanner3Image : URL.createObjectURL(bottomBanner3Image)}
                                  alt="Banner 3"
                                  className="w-full h-20 object-cover"
                                />
                                <button
                                  onClick={() => setBottomBanner3Image('')}
                                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">Link URL</label>
                          <input
                            type="text"
                            placeholder="https://example.com"
                            value={bottomBanner3Link}
                            onChange={(e) => setBottomBanner3Link(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Banners */}
                    {additionalBanners.map((banner, index) => (
                      <div key={banner.id} className="bg-gray-700/50 p-4 rounded-lg relative">
                        <button
                          onClick={() => setAdditionalBanners(additionalBanners.filter(b => b.id !== banner.id))}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold"
                          title="Remove banner"
                        >
                          ×
                        </button>
                        <h4 className="text-lg font-semibold text-yellow-400 mb-3">Banner {index + 4}</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-300 mb-2">Image</label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setAdditionalBanners(additionalBanners.map(b => 
                                      b.id === banner.id ? { ...b, image: file } : b
                                    ))
                                  }
                                }}
                                className="hidden"
                                id={`additionalBanner${banner.id}Upload`}
                              />
                              <label
                                htmlFor={`additionalBanner${banner.id}Upload`}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 hover:bg-gray-500 hover:border-yellow-500 cursor-pointer transition text-sm"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span>Upload Image</span>
                              </label>
                              {banner.image && (
                                <div className="relative rounded overflow-hidden border border-gray-500">
                                  <img
                                    src={typeof banner.image === 'string' ? banner.image : URL.createObjectURL(banner.image)}
                                    alt={`Banner ${index + 4}`}
                                    className="w-full h-20 object-cover"
                                  />
                                  <button
                                    onClick={() => setAdditionalBanners(additionalBanners.map(b => 
                                      b.id === banner.id ? { ...b, image: '' } : b
                                    ))}
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-300 mb-2">Link URL</label>
                            <input
                              type="text"
                              placeholder="https://example.com"
                              value={banner.link}
                              onChange={(e) => setAdditionalBanners(additionalBanners.map(b => 
                                b.id === banner.id ? { ...b, link: e.target.value } : b
                              ))}
                              className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Banner Button */}
                    <button
                      onClick={() => {
                        setAdditionalBanners([...additionalBanners, { id: nextBannerId, image: '', link: '' }])
                        setNextBannerId(nextBannerId + 1)
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 border-2 border-dashed border-gray-500 hover:border-yellow-500 text-gray-300 hover:text-yellow-400 px-4 py-6 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Banner
                    </button>

                    {/* Carousel Settings */}
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-yellow-400 mb-3">Carousel Settings</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-300 mb-2">Auto-rotate Interval (seconds)</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={carouselInterval}
                            onChange={(e) => setCarouselInterval(parseInt(e.target.value) || 5)}
                            className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={saveBannerSettings}
                disabled={isSavingBanners}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingBanners ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowBannerSettings(false)}
                disabled={isSavingBanners}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
