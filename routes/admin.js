var express = require('express');
const { render } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const verifyLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}


/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    console.log(products);
    res.render('admin/view-products', { admin: true, products })
  })
})

router.get('/login', (req, res) => {
  console.log(req.session.admin);
  if (req.session.admin) {

    res.redirect('/')
  } else {
    res.render('admin/login', { "loginErr": req.session.adminloginErr })
    req.session.adminloginErr = false
  }
})

router.get('/add-product', function (req, res) {
  res.render('admin/add-product')
})

router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.Image);
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image
    console.log(id);
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render("admin/add-product")
      } else {
        console.log(err);
      }
    })

  })
})

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/')
  })

})

router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product', { product })
})

router.post('/edit-product/:id', (req, res) => {
  console.log(req.params.id);
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})

module.exports = router;
