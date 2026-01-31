'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, TruckIcon, MapPin, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

type TaskType = 'pickup' | 'delivery'
type Priority = 'urgent' | 'high' | 'normal'
type TaskStatus = 'pending' | 'in_progress' | 'completed'

interface Task {
  id: string
  order_number: string
  type: TaskType
  customer_name: string
  address: string
  postcode: string
  item_count: number
  time_window: string
  pickup_date: string
  distance?: number
  priority: Priority
  status: TaskStatus
  order_status: string
}

interface TaskListProps {
  tasks: Task[]
}

const PRIORITY_COLORS = {
  urgent: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
  high: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
  normal: 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
}

const PRIORITY_BADGE_COLORS = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-amber-500 text-white',
  normal: 'bg-emerald-500 text-white',
}

const COMPLETED_STYLE = 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-900/20 opacity-60'

export function TaskList({ tasks }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'distance'>('priority')

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, normal: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      } else if (sortBy === 'time') {
        return new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime()
      } else if (sortBy === 'distance') {
        return (a.distance || 999) - (b.distance || 999)
      }
      return 0
    })

    return filtered
  }, [tasks, statusFilter, priorityFilter, sortBy])

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority (Urgent First)</SelectItem>
                  <SelectItem value="time">Time (Earliest First)</SelectItem>
                  <SelectItem value="distance">Distance (Nearest First)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter('all')
                  setPriorityFilter('all')
                  setSortBy('priority')
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Cards */}
      <div className="space-y-4">
        {filteredAndSortedTasks.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <Link key={task.id} href={`/runner/orders/${task.id}`}>
              <Card
                className={`border-l-4 hover:shadow-md transition-all cursor-pointer ${
                  task.status === 'completed'
                    ? COMPLETED_STYLE
                    : PRIORITY_COLORS[task.priority]
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        task.type === 'pickup'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {task.type === 'pickup' ? (
                          <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TruckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{task.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {task.type === 'pickup' ? 'Pickup' : 'Delivery'}
                        </p>
                      </div>
                    </div>
                    <Badge className={PRIORITY_BADGE_COLORS[task.priority]}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{task.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{task.address}</p>
                          <p className="text-sm text-muted-foreground">{task.postcode}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          {task.item_count} item{task.item_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{task.time_window}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{formatDate(task.pickup_date)}</p>
                      </div>
                      {task.distance !== undefined && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{task.distance.toFixed(1)} miles away</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant={task.status === 'completed' ? 'secondary' : 'default'}
                      className={task.status !== 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                      {task.status === 'completed' ? 'View Details' : 'Start Task'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
