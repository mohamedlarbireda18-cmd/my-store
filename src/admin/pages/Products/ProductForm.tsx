import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImageCropModal } from '../../components/ImageCropModal/ImageCropModal'
import {
  PackItemsEditor,
  type PackItemDraft,
} from '../../components/PackItemsEditor/PackItemsEditor'
import {
  ArrowLeft,
  Upload,
  ImageIcon,
  Save,
  Trash2,
  Plus,
  Package,
  Boxes,
} from 'lucide-react'
import {
  useProduct,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useReplacePackItems,
} from '../../../hooks/useProducts'
import { useCategories } from '../../../hooks/useCategories'
import { useImageUpload } from '../../../hooks/useImageUpload'
import { generateSlug } from '../../../utils/slug'
import { formatPrice } from '../../../utils/format'
import toast from 'react-hot-toast'
import './ProductForm.css'

interface VariantDraft {
  id?: string
  size: string
  color: string
  sku: string
  price: string
  stock: string
  isNew?: boolean
  isDeleted?: boolean
}

export function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: product, isLoading: loadingProduct } = useProduct(id)
  const { data: allProducts = [] } = useProducts()
  const { data: categories = [] } = useCategories()

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const createVariant = useCreateVariant()
  const updateVariant = useUpdateVariant()
  const deleteVariant = useDeleteVariant()
  const replacePackItems = useReplacePackItems()
  const { uploadImage, deleteImage, isUploading } = useImageUpload()

  // ----------------------------
  // Product form state
  // ----------------------------
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [isActive, setIsActive] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  // Type (only editable on create)
  const [productType, setProductType] = useState<'SIMPLE' | 'PACK'>('SIMPLE')

  // Simple: variants
  const [variants, setVariants] = useState<VariantDraft[]>([])

  // Pack: items + price + compare price + virtual variant
  const [packItems, setPackItems] = useState<PackItemDraft[]>([])
  const [packPrice, setPackPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [comparePriceTouched, setComparePriceTouched] = useState(false)
  const [packVariantId, setPackVariantId] = useState<string | null>(null)

  // Crop modal sources
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null)
  const [rawGallerySrc, setRawGallerySrc] = useState<string | null>(null)

  // UI
  const [slugTouched, setSlugTouched] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // ----------------------------
  // Load product on edit
  // ----------------------------
  useEffect(() => {
    if (product) {
      setName(product.name)
      setSlug(product.slug)
      setDescription(product.description ?? '')
      setCategoryId(product.category_id ?? '')
      setIsActive(product.is_active)
      setImageUrl(product.image_url)
      setGalleryImages(product.images ?? [])
      setProductType(product.product_type)

      if (product.product_type === 'PACK') {
        const v = product.variants[0]
        setPackVariantId(v?.id ?? null)
        setPackPrice(v ? String(v.price) : '')
        setComparePrice(
          product.compare_price !== null ? String(product.compare_price) : ''
        )
        setComparePriceTouched(product.compare_price !== null)

        setPackItems(
          (product.pack_items ?? []).map((pi) => ({
            variant_id: pi.variant_id,
            quantity: pi.quantity,
          }))
        )
      } else {
        setVariants(
          product.variants.map((v) => ({
            id: v.id,
            size: v.size ?? '',
            color: v.color ?? '',
            sku: v.sku ?? '',
            price: String(v.price),
            stock: String(v.stock),
          }))
        )
      }

      setSlugTouched(true)
    }
  }, [product])

  // Auto-slug on create
  useEffect(() => {
    if (!isEdit && !slugTouched) setSlug(generateSlug(name))
  }, [name, isEdit, slugTouched])

  // Compute pack real price
  const packRealPrice = useMemo(() => {
    let sum = 0
    for (const item of packItems) {
      for (const p of allProducts) {
        const v = p.variants.find((vv) => vv.id === item.variant_id)
        if (v) {
          sum += v.price * item.quantity
          break
        }
      }
    }
    return sum
  }, [packItems, allProducts])

  // Auto-fill compare price from real price (until user edits it)
  useEffect(() => {
    if (productType === 'PACK' && !comparePriceTouched && packRealPrice > 0) {
      setComparePrice(String(packRealPrice))
    }
  }, [packRealPrice, productType, comparePriceTouched])

  // ----------------------------
  // Main image handling
  // ----------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Max 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Use JPEG, PNG, WebP or AVIF.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setRawImageSrc(objectUrl)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropSave = async (blob: Blob) => {
    const url = await uploadImage(blob, 'product.jpg')
    if (url) {
      if (imageUrl) await deleteImage(imageUrl)
      setImageUrl(url)
      toast.success('Image ready')
    }
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc)
    setRawImageSrc(null)
  }

  const handleCropCancel = () => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc)
    setRawImageSrc(null)
  }

  const handleRemoveImage = async () => {
    if (!imageUrl) return
    await deleteImage(imageUrl)
    setImageUrl(null)
  }

  // ----------------------------
  // Gallery image handling
  // ----------------------------
  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Max 5 MB.')
      if (galleryInputRef.current) galleryInputRef.current.value = ''
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Use JPEG, PNG, WebP or AVIF.')
      if (galleryInputRef.current) galleryInputRef.current.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setRawGallerySrc(objectUrl)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleGalleryCropSave = async (blob: Blob) => {
    const url = await uploadImage(blob, 'gallery.jpg')
    if (url) {
      setGalleryImages((prev) => [...prev, url])
      toast.success('Image added to gallery')
    }
    if (rawGallerySrc) URL.revokeObjectURL(rawGallerySrc)
    setRawGallerySrc(null)
  }

  const handleGalleryCropCancel = () => {
    if (rawGallerySrc) URL.revokeObjectURL(rawGallerySrc)
    setRawGallerySrc(null)
  }

  const handleRemoveGalleryImage = async (url: string) => {
    await deleteImage(url)
    setGalleryImages((prev) => prev.filter((u) => u !== url))
  }

  // ----------------------------
  // Variant handlers (Simple)
  // ----------------------------
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { size: '', color: '', sku: '', price: '', stock: '0', isNew: true },
    ])
  }

  const updateVariantDraft = (
    index: number,
    field: keyof VariantDraft,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }

  const removeVariantDraft = (index: number) => {
    setVariants((prev) => {
      const v = prev[index]
      if (v.id) {
        return prev.map((vv, i) =>
          i === index ? { ...vv, isDeleted: true } : vv
        )
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const restoreVariantDraft = (index: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, isDeleted: false } : v))
    )
  }

  // ----------------------------
  // Validation
  // ----------------------------
  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required'
    if (!slug.trim()) return 'Slug is required'

    if (productType === 'SIMPLE') {
      const activeVariants = variants.filter((v) => !v.isDeleted)
      if (activeVariants.length === 0) return 'Add at least one variant'
      for (const v of activeVariants) {
        if (!v.price || Number(v.price) <= 0)
          return 'Each variant needs a valid price'
        if (v.stock === '' || Number(v.stock) < 0)
          return 'Each variant needs a valid stock quantity'
      }
    } else {
      if (!packPrice || Number(packPrice) <= 0)
        return 'Pack price is required'
      if (packItems.length === 0) return 'Add at least one item to the pack'
      if (packItems.some((i) => i.quantity <= 0))
        return 'Each pack item needs a quantity greater than 0'
    }

    return null
  }

  // ----------------------------
  // Save
  // ----------------------------
  const handleSave = async () => {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    setIsSaving(true)
    try {
      const productPayload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        image_url: imageUrl,
        images: galleryImages,
        is_active: isActive,
        product_type: productType,
        compare_price:
          productType === 'PACK' && comparePrice
            ? Number(comparePrice)
            : null,
      }

      let productId = id
      if (isEdit && id) {
        await updateProduct.mutateAsync({ id, input: productPayload })
      } else {
        const created = await createProduct.mutateAsync(productPayload)
        productId = created.id
      }

      if (!productId) throw new Error('Product ID missing')

      // ==========================
      // SIMPLE: variants flow
      // ==========================
      if (productType === 'SIMPLE') {
        for (const v of variants) {
          if (v.isDeleted && v.id) {
            await deleteVariant.mutateAsync(v.id)
            continue
          }
          if (v.isDeleted) continue

          const variantPayload = {
            product_id: productId,
            size: v.size.trim() || null,
            color: v.color.trim() || null,
            sku: v.sku.trim() || null,
            price: Number(v.price),
            stock: Number(v.stock),
            is_active: true,
          }

          if (v.id) {
            await updateVariant.mutateAsync({ id: v.id, input: variantPayload })
          } else {
            await createVariant.mutateAsync(variantPayload)
          }
        }
      } else {
        // ==========================
        // PACK: virtual variant + items
        // ==========================
        const packVariantPayload = {
          product_id: productId,
          size: null,
          color: null,
          sku: null,
          price: Number(packPrice),
          stock: 0,
          is_active: true,
        }

        if (packVariantId) {
          await updateVariant.mutateAsync({
            id: packVariantId,
            input: { price: Number(packPrice) },
          })
        } else {
          const created = await createVariant.mutateAsync(packVariantPayload)
          setPackVariantId(created.id)
        }

        await replacePackItems.mutateAsync({
          packId: productId,
          items: packItems.map((i) => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
        })
      }

      toast.success(isEdit ? 'Product updated' : 'Product created')
      navigate('/admin/products')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // ----------------------------
  // Render
  // ----------------------------
  if (isEdit && loadingProduct) {
    return <div className="product-form__loading">Loading product...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="product-form__header">
        <button
          className="product-form__back"
          onClick={() => navigate('/admin/products')}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="product-form__title-wrap">
          <h1 className="product-form__title">
            {isEdit
              ? productType === 'PACK'
                ? 'Edit Pack'
                : 'Edit Product'
              : productType === 'PACK'
              ? 'New Pack'
              : 'New Product'}
          </h1>
          <p className="product-form__subtitle">
            {isEdit
              ? 'Update details, images and contents.'
              : 'Fill in the details below.'}
          </p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="product-form__grid">
        {/* ==============================
            Left column
        ============================== */}
        <div className="product-form__main">
          {/* Type selector — only on create */}
          {!isEdit && (
            <div className="admin-card product-form__card">
              <h2 className="product-form__section-title">Product Type</h2>
              <p className="product-form__section-subtitle">
                Choose between a simple product or a bundled pack.
              </p>
              <div className="product-form__type-grid">
                <button
                  type="button"
                  className={`product-form__type-card ${
                    productType === 'SIMPLE' ? 'product-form__type-card--active' : ''
                  }`}
                  onClick={() => setProductType('SIMPLE')}
                >
                  <Package size={22} />
                  <div className="product-form__type-title">Simple Product</div>
                  <div className="product-form__type-desc">
                    A single product with variants (size, color, etc.)
                  </div>
                </button>
                <button
                  type="button"
                  className={`product-form__type-card ${
                    productType === 'PACK' ? 'product-form__type-card--active' : ''
                  }`}
                  onClick={() => setProductType('PACK')}
                >
                  <Boxes size={22} />
                  <div className="product-form__type-title">Pack / Bundle</div>
                  <div className="product-form__type-desc">
                    A bundle of products sold together at a discount.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Product details */}
          <div className="admin-card product-form__card">
            <h2 className="product-form__section-title">
              {productType === 'PACK' ? 'Pack Details' : 'Product Details'}
            </h2>

            <div className="product-form__field">
              <label className="product-form__label">
                Name <span className="product-form__required">*</span>
              </label>
              <input
                type="text"
                className="product-form__input"
                placeholder={
                  productType === 'PACK' ? 'e.g. Summer Bundle' : 'e.g. Classic T-Shirt'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="product-form__field">
              <label className="product-form__label">
                Slug <span className="product-form__required">*</span>
              </label>
              <input
                type="text"
                className="product-form__input"
                placeholder="e.g. summer-bundle"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugTouched(true)
                }}
              />
              <span className="product-form__hint">
                URL-friendly identifier. Auto-generated from name.
              </span>
            </div>

            <div className="product-form__field">
              <label className="product-form__label">Description</label>
              <textarea
                rows={5}
                className="product-form__input product-form__textarea"
                placeholder="Describe the product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="product-form__field">
              <label className="product-form__label">Category</label>
              <select
                className="product-form__input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="product-form__checkbox">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Active (visible to customers)</span>
            </label>
          </div>

          {/* ==============================
              SIMPLE: Variants
          ============================== */}
          {productType === 'SIMPLE' && (
            <div className="admin-card product-form__card">
              <div className="product-form__card-header">
                <div>
                  <h2 className="product-form__section-title">Variants</h2>
                  <p className="product-form__section-subtitle">
                    Add each combination of size, color, price and stock.
                  </p>
                </div>
                <button
                  className="admin-btn admin-btn--secondary admin-btn--sm"
                  onClick={addVariant}
                >
                  <Plus size={14} />
                  Add Variant
                </button>
              </div>

              {variants.filter((v) => !v.isDeleted).length === 0 ? (
                <div className="product-form__variants-empty">
                  <p>No variants yet. Add at least one.</p>
                  <button
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    onClick={addVariant}
                  >
                    <Plus size={14} />
                    Add Variant
                  </button>
                </div>
              ) : (
                <div className="product-form__variants">
                  <div className="product-form__variants-head">
                    <div>Size</div>
                    <div>Color</div>
                    <div>SKU</div>
                    <div>Price (DZD)</div>
                    <div>Stock</div>
                    <div></div>
                  </div>

                  {variants.map((v, i) => {
                    if (v.isDeleted) {
                      return (
                        <div
                          key={i}
                          className="product-form__variant product-form__variant--deleted"
                        >
                          <div className="product-form__variant-deleted-text">
                            Variant marked for deletion.
                          </div>
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => restoreVariantDraft(i)}
                          >
                            Undo
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div key={i} className="product-form__variant">
                        <input
                          type="text"
                          className="product-form__input product-form__input--sm"
                          placeholder="M"
                          value={v.size}
                          onChange={(e) =>
                            updateVariantDraft(i, 'size', e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="product-form__input product-form__input--sm"
                          placeholder="Black"
                          value={v.color}
                          onChange={(e) =>
                            updateVariantDraft(i, 'color', e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="product-form__input product-form__input--sm"
                          placeholder="TS-BLK-M"
                          value={v.sku}
                          onChange={(e) =>
                            updateVariantDraft(i, 'sku', e.target.value)
                          }
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="product-form__input product-form__input--sm"
                          placeholder="1500"
                          value={v.price}
                          onChange={(e) =>
                            updateVariantDraft(i, 'price', e.target.value)
                          }
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="product-form__input product-form__input--sm"
                          placeholder="10"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariantDraft(i, 'stock', e.target.value)
                          }
                        />
                        <button
                          className="product-form__variant-remove"
                          onClick={() => removeVariantDraft(i)}
                          title="Remove variant"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==============================
              PACK: Items editor + prices
          ============================== */}
          {productType === 'PACK' && (
            <>
              <div className="admin-card product-form__card">
                <div className="product-form__card-header">
                  <div>
                    <h2 className="product-form__section-title">Pack Items</h2>
                    <p className="product-form__section-subtitle">
                      Choose the products included in this pack.
                    </p>
                  </div>
                </div>

                <PackItemsEditor
                  items={packItems}
                  onChange={setPackItems}
                  allProducts={allProducts}
                  currentProductId={id}
                  packPrice={Number(packPrice) || 0}
                />
              </div>

              <div className="admin-card product-form__card">
                <h2 className="product-form__section-title">Pack Pricing</h2>
                <p className="product-form__section-subtitle">
                  Set the price customers pay for the whole bundle.
                </p>

                <div className="product-form__field">
                  <label className="product-form__label">
                    Pack Price (DZD) <span className="product-form__required">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="product-form__input"
                    placeholder="e.g. 3500"
                    value={packPrice}
                    onChange={(e) => setPackPrice(e.target.value)}
                  />
                  {packRealPrice > 0 && (
                    <span className="product-form__hint">
                      Real price if bought separately:{' '}
                      <strong>{formatPrice(packRealPrice)}</strong>
                    </span>
                  )}
                </div>

                <div className="product-form__field">
                  <label className="product-form__label">
                    Compare-at Price (DZD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="product-form__input"
                    placeholder="Auto-filled"
                    value={comparePrice}
                    onChange={(e) => {
                      setComparePrice(e.target.value)
                      setComparePriceTouched(true)
                    }}
                  />
                  <span className="product-form__hint">
                    Shown crossed out on the storefront. Auto-filled from items' real
                    price.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==============================
            Right column: images
        ============================== */}
        <div className="product-form__sidebar">
          {/* Main image */}
          <div className="admin-card product-form__card">
            <h2 className="product-form__section-title">
              {productType === 'PACK' ? 'Pack Image' : 'Product Image'}
            </h2>
            <p className="product-form__section-subtitle">
              Main image. JPEG, PNG, WebP or AVIF. Max 5 MB.
            </p>

            {imageUrl ? (
              <div className="product-form__image-preview">
                <img src={imageUrl} alt="Preview" />
                <div className="product-form__image-actions">
                  <button
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload size={14} />
                    Replace
                  </button>
                  <button
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="product-form__image-drop"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImageIcon size={32} />
                <span className="product-form__image-drop-title">
                  {isUploading ? 'Uploading...' : 'Click to upload image'}
                </span>
                <span className="product-form__image-drop-hint">
                  {isUploading ? 'Please wait' : 'Or drag and drop'}
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Gallery */}
          <div className="admin-card product-form__card">
            <div className="product-form__gallery-header">
              <div>
                <h2 className="product-form__section-title">Gallery</h2>
                <p className="product-form__section-subtitle">
                  Extra images shown on the product page.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--secondary admin-btn--sm"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploading}
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {galleryImages.length === 0 ? (
              <div className="product-form__gallery-empty">
                <ImageIcon size={24} />
                <span>No extra images yet</span>
              </div>
            ) : (
              <div className="product-form__gallery-grid">
                {galleryImages.map((url) => (
                  <div key={url} className="product-form__gallery-item">
                    <img src={url} alt="Gallery item" />
                    <button
                      type="button"
                      className="product-form__gallery-remove"
                      onClick={() => handleRemoveGalleryImage(url)}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleGalleryFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Crop modal — main image */}
      {rawImageSrc && (
        <ImageCropModal
          imageSrc={rawImageSrc}
          onCancel={handleCropCancel}
          onSave={handleCropSave}
          aspect={1}
          title="Crop Product Image"
        />
      )}

      {/* Crop modal — gallery image */}
      {rawGallerySrc && (
        <ImageCropModal
          imageSrc={rawGallerySrc}
          onCancel={handleGalleryCropCancel}
          onSave={handleGalleryCropSave}
          aspect={1}
          title="Crop Gallery Image"
        />
      )}
    </div>
  )
}