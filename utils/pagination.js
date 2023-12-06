module.exports = (req, count, page, limit, category, level, ispremium) => {
    category = category ? 'category='+category : ''
    level = level ? '&level='+level : ''
    ispremium = ispremium ? '&ispremium='+ispremium : ''

    let path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}?${category}${level}${ispremium}`
    let links = {}
    if (count - page * limit < 1 ) {
        links.next = ``

        if (page - 1 < 1) {
            links.prev = ``

        }else {
            links.prev = `${path}&page=${page-1}&limit=${limit}`
        }
    } else {
        links.next = `${path}&page=${page+1}&limit=${limit}`

        if (page - 1 < 1) {
            links.prev = ``
        }else {
            links.prev = `${path}&page=${page-1}&limit=${limit}`
        }
    }

    return {
        links,
        total_items : count
    }
}