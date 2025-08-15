const paginate = async ({
    model,
    page = 1,
    limit = 10,
    where = {},
    populate = [], // giống include trong Sequelize
    sort = { createdAt: -1 }, // tương đương với DESC
  }) => {
    const skip = (page - 1) * limit;
  
    const [totalItems, items] = await Promise.all([
      model.countDocuments(where),
      model.find(where)
        .populate(populate)
        .sort(sort)
        .skip(skip)
        .limit(limit),
    ]);
  
    const totalPages = Math.ceil(totalItems / limit);
  
    return {
      data: items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  };
  
  module.exports = { paginate };
  