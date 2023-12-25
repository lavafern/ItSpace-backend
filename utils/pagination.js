module.exports = {
    
    coursePagination : (req, count, page, limit, category, level, ispremium, order) => {
        category = category ? 'category='+category : '';
        level = level ? '&level='+level : '';
        ispremium = ispremium ? '&ispremium='+ispremium : '';
        order = order ? '&order='+order : '';
        let path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}?${category}${level}${ispremium}${order}`;
        let links = {};
        if (count - page * limit < 1 ) {
            links.next = '';

            if (page - 1 < 1) {
                links.prev = '';

            }else {
                links.prev = `${path}&page=${page-1}&limit=${limit}`;
            }
        } else {
            links.next = `${path}&page=${page+1}&limit=${limit}`;

            if (page - 1 < 1) {
                links.prev = '';
            }else {
                links.prev = `${path}&page=${page-1}&limit=${limit}`;
            }
        }

        return {
            links,
            total_items : count
        };
    },
    transactionsPagination : (req, count, page, limit, status,courseCode,method,from,to) => {
        status = status ? 'status='+status : '';
        courseCode = courseCode ? '&courseCode='+courseCode : '';
        method = method ? '&method='+method : '';
        from = from ? '&from='+from : '';
        to = to ? '&to='+to : '';

        let path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}?${status}${courseCode}${method}${from}${to}`;
        let links = {};
        if (count - page * limit < 1 ) {
            links.next = '';

            if (page - 1 < 1) {
                links.prev = '';

            }else {
                links.prev = `${path}&page=${page-1}&limit=${limit}`;
            }
        } else {
            links.next = `${path}&page=${page+1}&limit=${limit}`;

            if (page - 1 < 1) {
                links.prev = '';
            }else {
                links.prev = `${path}&page=${page-1}&limit=${limit}`;
            }
        }

        return {
            links,
            total_items : count
        };
    },
    userPagination : (req, count, page, limit) => {

        let path = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}?`;
        let links = {};
        if (count - page * limit < 1 ) {
            links.next = '';

            if (page - 1 < 1) {
                links.prev = '';

            }else {
                links.prev = `${path}page=${page-1}&limit=${limit}`;
            }
        } else {
            links.next = `${path}page=${page+1}&limit=${limit}`;

            if (page - 1 < 1) {
                links.prev = '';
            }else {
                links.prev = `${path}page=${page-1}&limit=${limit}`;
            }
        }

        return {
            links,
            total_items : count
        };
    }
};