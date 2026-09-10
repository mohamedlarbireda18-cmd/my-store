import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useCategories'
import type { Category, CategoryInput } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Badge } from '../../components/ui/Badge'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '../../components/ui/Table'
import { Card } from '../../components/ui/Card'
import { generateSlug } from '../../utils/slug'
import { formatDate } from '../../utils/format'

export function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const { data: categories, isLoading, error } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const handleCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    await deleteMutation.mutateAsync(deletingCategory.id)
    setDeletingCategory(null)
  }

  if (isLoading) return <FullPageSpinner />

  if (error) {
    return (
      <Card>
        <EmptyState
          title="Error loading categories"
          description={(error as Error).message}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product categories
          </p>
        </div>
        <Button onClick={handleCreate}>+ Add Category</Button>
      </div>

      {/* Content */}
      {categories && categories.length === 0 ? (
        <Card>
          <EmptyState
            title="No categories yet"
            description="Get started by creating your first category"
            action={
              <Button onClick={handleCreate}>+ Add Category</Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Slug</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? 'success' : 'gray'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(category.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeletingCategory(category)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
        onSubmit={async (data) => {
          if (editingCategory) {
            await updateMutation.mutateAsync({ id: editingCategory.id, input: data })
          } else {
            await createMutation.mutateAsync(data)
          }
          handleCloseModal()
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

// Category Form Modal Component
interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSubmit: (data: CategoryInput) => Promise<void>
  isSubmitting: boolean
}

function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSubmit,
  isSubmitting,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryInput>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      is_active: true,
    },
  })

  const nameValue = watch('name')

  // Auto-generate slug when name changes (only for new categories)
  React.useEffect(() => {
    if (!category && nameValue) {
      setValue('slug', generateSlug(nameValue))
    }
  }, [nameValue, category, setValue])

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      if (category) {
        reset({
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          is_active: category.is_active,
        })
      } else {
        reset({
          name: '',
          slug: '',
          description: '',
          is_active: true,
        })
      }
    }
  }, [isOpen, category, reset])

  const handleFormSubmit = async (data: CategoryInput) => {
    await onSubmit(data)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add Category'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g., T-Shirts"
          required
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <Input
          label="Slug"
          placeholder="e.g., t-shirts"
          required
          helperText="URL-friendly identifier. Auto-generated from name."
          error={errors.slug?.message}
          {...register('slug', { required: 'Slug is required' })}
        />

        <Textarea
          label="Description"
          placeholder="Optional description..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active (visible to customers)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {category ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}