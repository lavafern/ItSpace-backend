module.exports = {
    getAllCourseFilter : (ispremium,level,category) => {

        categories = category ? category.split(',') : []
        levels = level ? level.split(',') : []
        ispremium = ispremium === '0' ? false :  ispremium === '1' ? true : []

        const ispremiumFilter = {
            type : 'ispremium',
            data : ispremium
        }
        const levelFilter = 
        {
            type : 'level',
            data :  levels.map(i => {
                return {level : i}
            })
        }
      
        const categoriesFilter = 
        {
            type : 'category',
            data : categories.map(i => {
                return {category : {
                    name : i
                }}
            })
        }

        


        return [ispremiumFilter,levelFilter,categoriesFilter].map((e) => {
            if (e.data.length < 1 || e.data === undefined) return false
    
            if (e.type === 'ispremium') {
                const result = {isPremium : e.data}
                return result
            }
            if (e.type === 'level') {
                return { /// filter for level
                    OR : e.data
                  }
            }
            if (e.type === 'category') {
                return { /// filter for categories
                    courseCategory : {
                      some : {
                        OR : e.data
                      }
                    }
                  }
            }
        }).filter(Boolean)


    },

    getAllTransactionFilter : (courseCode,status,method) => {
        courseCode = courseCode ? courseCode : []
        status = status === '0' ? false :  status === '1' ? true : []
        method = method ? method : []

        const courseCodeFilter = {
            type : 'courseCode',
            data : courseCode
        }
        const statusFilter = {
            type : 'status',
            data : status
        }
        const methodFilter = {
            type : 'method',
            data : method
        }


        return [courseCodeFilter,statusFilter,methodFilter].map((e) => {
            if (e.data.length < 1 || e.data === undefined) return false
            
            if (e.type === 'courseCode') {
                const result =  {course : {
                    code : e.data
                }}
                return result
            }

            if (e.type === 'status') {
                const result = {payDone : e.data }
                return result
            }

            if (e.type === 'method') {
                const result =  {paymentMethod : e.data}
                return result
            }
        }).filter(Boolean)

    }
}