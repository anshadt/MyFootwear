const admin =require('../../routes/admin');
const product=require('../../models/productModel');
const category=require('../../models/categoryModel')
const user=require('../../models/userModel')
const upload=require('../../config/multer')
const fs=require('fs')
const path=require('path')
const sharp=require('sharp');
const { title } = require('process');



//Load Product Page Section
const load_ProuctPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6
    const skip = (page-1)*limit;
    if (req.session.isAdmin) {
      const [Product,totaProduct] = await Promise.all([product.find().skip(skip).limit(limit),product.countDocuments()]);
      const totalPages = Math.ceil(totaProduct/limit);
      //const Product = await product.find().populate('category_id')
      res.render("admin/productMng",{Product,title:"Product Mangement",currentPage:page,totalPages,limit});
    } else {
      res.redirect("/admin/loadAdminDash");
    }
  } catch (error) {
    console.error(error);
        res.status(500).json({ err: "something went wrong while adding new category" });
  }
   
  };
  
//Add Product Page Section
const addProuct_Page=async (req, res) => {
    if (req.session.isAdmin) {
      const Category = await category.find({isDeleted:false});
      res.render("admin/addProduct", { Category,title:'add Product'});
    } else {
      res.redirect("/admin/addProuctPage");
    }
  };

//Add Product Section
const add_Product = async (req, res) => {
  console.log(req.body)
  try {
    const { productName, Category_id, description, stock, price,specifications } = req.body;
    const images = req.files || []; // Ensure `images` is always an array
     const existProduct = await product.findOne({ productname: productName });
    const Category = await category.find({ isDeleted: false });
    const parsedSpecifications = JSON.parse(specifications)

    if (existProduct) {
      return res.status(400).json({ error: "Product already exists" });
    }

    let Images = [];
    if (images.length > 0) {
      images.forEach(image => {
        const relativePath = image.path.replace(/^.*[\\\/]public[\\\/]uploads[\\\/]/, '/uploads/');
        Images.push(relativePath);
      });
    }

    const newProduct = new product({
      productname: productName,
      category_id: Category_id,
      description,
      stock,
      price,
      images: Images,
      specifications : parsedSpecifications,
    });

    await newProduct.save();
    res.status(200).json({ success: true });
    console.log("Product added successfully");

  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Error adding product' });
  }
};


//Edit Product Page Loading Section
const loadEditProductPage = async (req, res) => {
  try {
    const productId = req.params.id; 
    const Product = await product.findById(productId).populate('category_id')
    const Category=await category.find({isDeleted:false})
    if (!Product) {
      return res.status(404).send('Product not found');
    }
    res.render('admin/editProduct', { Product,Category});
  } catch (error) {
    console.error('Error loading edit page:', error);
    res.status(500).send('Error loading product edit page');
  }
};




//Edit Product post Section
const editProduct = async (req, res) => {
  try {   
    const productId = req.params.id;
    const { productName, Category_id,price,stock,description} = req.body;
    const images = req.files;
    const existingProduct = await product.findById(productId);
    if (!existingProduct) {
      return res.status(404).send('Product not found');
    }
    existingProduct.productname = productName;
    existingProduct.category_id = Category_id;
    existingProduct.description = description;
    existingProduct.stock = stock;
    existingProduct.price = price;
    if (images && images.length > 0) {
      let updatedImages = [];
      images.forEach(image => {
        const relativePath = image.path.replace(/^.*[\\\/]public[\\\/]uploads[\\\/]/, '/uploads/');
        updatedImages.push(relativePath);
      });
      existingProduct.images = updatedImages;
    }
    await existingProduct.save();
    res.redirect('/admin/loadProuctPage');
    console.log("Product updated successfully");

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).send('Error updating product');
  }
};

const delete_Product = async (req, res) => {
  if (req.session.isAdmin) {

    try {
      const { productId } = req.params;
      await product.findByIdAndUpdate(productId, { isDelete: true });
      res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
      console.error("Something went wrong while deleting the product");
      res.status(500).json({ success: false, err: "Error deleting product" });
    }
  } else {
    res.redirect("/admin/login");
  }
};



const restore_Product = async (req, res) => {
  if (req.session.isAdmin) {
    try {
      const { productId } = req.params;
      const Product = await product.findById(productId).populate('category_id');
      
      if (Product.category_id.isDeleted) {
        return res.status(400).json({ success: false, message: 'Category of this product is deleted' });
      }
      
      await product.findByIdAndUpdate(productId, { isDelete: false });
      res.status(200).json({ success: true, message: "Product restored successfully" });
    } catch (err) {
      res.status(500).json({ success: false, err: "Error restoring product" });
    }
  } else {
    res.redirect("/admin/login");
  }
};




module.exports={
    load_ProuctPage,
    addProuct_Page,
    add_Product,
    loadEditProductPage,
    editProduct,
    delete_Product,
    restore_Product
}