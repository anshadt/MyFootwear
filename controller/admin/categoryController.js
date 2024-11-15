const admin =require("../../routes/admin")
const category=require("../../models/categoryModel")



//Load Category Page Section
const load_CategoryPage=async(req,res)=>{
     
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const skip = (page -1) * limit;
       if(req.session.isAdmin){
        const [catData, totalCategories]=await Promise.all([category.find().skip(skip).limit(limit),category.countDocuments()])
        const totalPages = Math.ceil(totalCategories/limit)
           res.render('admin/categoryPage',{catData,title:'Category Management',currentPage:page,totalPages,limit})
       } else{
        res.redirect('/admin/login')
       }
    } catch (error) {
        console.error(error);
        res.status(500).json({ err: "something went wrong while adding new category" });
    }
}


// const load_CategoryPage = async(req,res)=>{
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = 4;
//         const skip = (page-1)*limit;

//         const categoryData = await category.sort({createdAt:-1}).skip(skip).limit(limit);
//         const tc = await category.countDocuments();
//         const tp = Math.ceil(totalCategories / limit);
//         res.render('admin/categoryPage',{
//             cat:categoryData,
//             currentPage:page,
//             totalPages:tp,
//             totalCategories: tc
//         })
//     } catch (error) {
//         console.error(error)
//         res.redirect('/admin/admin_Dashboard')
//     }
// }

// Add Category Section
const add_Category=async(req,res)=>{
    try {
        const categoryName=req.body.name;
        const categoryDis = req.body.discription;
        const upperCaseName = categoryName.toUpperCase();
        const existCat = await category.findOne({ category_name: upperCaseName });
        const catData=await category.find()
        if(existCat){
            return res.render('admin/categoryPage',{
              existCat:"This category is already exist",
                catData
            })
        }
        const newcategory =new category({
            category_name:upperCaseName,
            category_discription : categoryDis
        });
            await newcategory.save()
            res.redirect('/admin/categoryPage')
        
    } catch (error) {
        console.log("error");
        res.status(500).json({ err: "something went wrong while adding new category" });
    }
}

// const add_Category = async (req,res)=>{
//     const { name,discription} = req.body
//     try {
//         const existCat = await category.findOne({name})
//         if(existCat){
//             return res.status(400).json({error:"category already exists"})
            
//         }
//         const newcategory = new category({
//             name,
//             discription
//         })
//         await newcategory.save()
//         returnres.json({message:"Category added sucessfully"})
//     } catch (error) {
//         return res.status(500).json({error:"internal server Error"})
//     }
// }

//Edit Category Section



const edit_Category = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const upperCaseName = name.toUpperCase();
      const cateData = await category.findById(id);
      if (!cateData) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      const existCat = await category.findOne({ category_name: upperCaseName });
      // Check if a category with the new name already exists
      if (existCat && existCat._id.toString() !== id) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
      cateData.category_name = upperCaseName;
      console.log(cateData);
      
      await cateData.save();
  
      res.status(200).json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ success: false, message: 'Failed to update category' });
    }
  };
  

//Delete Category Section
const delete_Category=async (req, res) => {
  try {
      const { id } = req.params;
      const Category = await category.findById(id);
      if (!Category) {
          return res.status(404).json({ success: false, message: 'Category not found' });
      }
      Category.isDeleted = true;
      await Category.save();
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};


//Restore Category Setion
  const restore_Category=async (req, res) => {
    try {
        const { id } = req.params;
        const Category = await category.findById(id);
        if (!Category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        if (!Category.isDeleted) {
            return res.status(400).json({ success: false, message: 'Category is not deleted' });
        }
        Category.isDeleted = false;
        await Category.save();
        res.status(200).json({ success: true, message: 'Category restored successfully' });
    } catch (error) {
        console.error('Error restoring category:', error);
        res.status(500).json({ success: false, message: 'Failed to restore category' });
    }
};

  
  



module.exports={
    load_CategoryPage,
    add_Category,
    delete_Category,
    edit_Category,
    restore_Category
}