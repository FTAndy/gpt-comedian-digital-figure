interface Props {
  max: number,
  tasks: Array<() => Promise<any>>
}

export async function maxLimitedAsync<Result>(props: Props): Promise<Array<Result>> {
  const {max, tasks} = props

  const totalTask = tasks.length
  let count = 0
  let result: Array<Result> = []
  return new Promise((resolve, reject) => {
    function startTask() {
      if (tasks.length === 0) {
        return
      }
      const curTask = tasks[0]
      tasks.shift()
      count++
      curTask()
      .then((taskResult: any) => {
        result.push(taskResult)
        if (result.length === totalTask) {
          resolve(result)
          return
        }
        count--
        startTask()
      })
      .catch((e) => {
        reject(e)
      })
    }

    while (count < max && tasks.length > 0) {
      startTask()
    }
  })
}