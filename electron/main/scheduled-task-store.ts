import Store from 'electron-store'
import {
  appendScheduledTaskLog,
  getDefaultScheduledTasks,
  mergeScheduledTasks,
  type ScheduledTaskDefinition,
  type ScheduledTaskLog,
} from './scheduled-tasks'

interface ScheduledTaskStoreShape {
  tasks: Array<Partial<ScheduledTaskDefinition> & Pick<ScheduledTaskDefinition, 'id'>>
  logs: ScheduledTaskLog[]
}

const store = new Store<ScheduledTaskStoreShape>({
  name: 'scheduled-tasks',
  defaults: {
    tasks: getDefaultScheduledTasks(),
    logs: [],
  },
})

export function getScheduledTasks(): ScheduledTaskDefinition[] {
  return mergeScheduledTasks(store.get('tasks'))
}

export function getScheduledTask(taskId: string): ScheduledTaskDefinition | null {
  return getScheduledTasks().find((task) => task.id === taskId) ?? null
}

export function saveScheduledTasks(tasks: ScheduledTaskDefinition[]): ScheduledTaskDefinition[] {
  store.set('tasks', tasks)
  return tasks
}

export function updateScheduledTask(
  taskId: string,
  patch: Partial<ScheduledTaskDefinition>,
): ScheduledTaskDefinition | null {
  const tasks = getScheduledTasks()
  const nextTasks = tasks.map((task) => {
    if (task.id !== taskId) return task
    return {
      ...task,
      ...patch,
      schedule: {
        ...task.schedule,
        ...patch.schedule,
      },
    }
  })

  saveScheduledTasks(nextTasks)
  return nextTasks.find((task) => task.id === taskId) ?? null
}

export function getScheduledTaskLogs(taskId?: string): ScheduledTaskLog[] {
  const logs = store.get('logs')
  if (!taskId) return logs
  return logs.filter((log) => log.taskId === taskId)
}

export function appendLogEntry(log: ScheduledTaskLog): ScheduledTaskLog[] {
  const nextLogs = appendScheduledTaskLog(store.get('logs'), log)
  store.set('logs', nextLogs)
  return nextLogs
}
