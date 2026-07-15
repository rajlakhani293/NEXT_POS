"use client"

import { useEffect, useMemo, useState } from "react"

import DynamicForm from "@/components/DynamicForm"
import { accounting } from "@/lib/api/accounting"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { showToast } from "@/lib/toast"

type TransactionAccountFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editId?: number | string | null
  defaultCategory?: string
}

type TransactionAccountFormValues = {
  name: string
  account: string
  category_identifier: string
  sub_category_id: string
  description: string
}

const initialValues: TransactionAccountFormValues = {
  name: "",
  account: "",
  category_identifier: "assets",
  sub_category_id: "",
  description: "",
}

const categoryOptions = [
  { label: "Assets", value: "assets" },
  { label: "Liabilities", value: "liabilities" },
  { label: "Revenues", value: "revenues" },
  { label: "Expenses", value: "expenses" },
  { label: "Equity", value: "equity" },
]

const buildFields = (
  t: (key: string) => string,
  parentAccounts: any[]
) => [
  {
    name: "name",
    label: t("Name"),
    placeholder: t("Provide a name to the resource."),
    type: "text",
    required: true,
  },
  {
    name: "category_identifier",
    label: t("Main Account"),
    placeholder: t("Select the category of this account."),
    type: "select",
    required: true,
    options: categoryOptions.map((option) => ({
      label: t(option.label),
      value: option.value,
    })),
  },
  {
    name: "sub_category_id",
    label: t("Sub Account"),
    placeholder: t("Assign to a sub category."),
    type: "select",
    allowClear: true,
    options: parentAccounts.map((account: any) => ({
      label: account.name,
      value: String(account.id),
    })),
  },
  {
    name: "account",
    label: t("Account"),
    placeholder: t("Provide the accounting number for this category. If left empty, it will be generated automatically."),
    type: "text",
  },
  {
    name: "description",
    label: t("Description"),
    placeholder: t("Enter description"),
    type: "textarea",
    rows: 3,
  },
]

export function TransactionAccountForm({
  isOpen,
  onClose,
  onSuccess,
  editId,
  defaultCategory = initialValues.category_identifier,
}: TransactionAccountFormProps) {
  const { t } = useTranslation()
  const accounts = (accounting as any).useGetAccountsDropdownQuery()
  const [createAccount] = (accounting as any).useCreateAccountMutation()
  const [editAccount] = (accounting as any).useEditAccountMutation()
  const [getAccountById, { data, isLoading }] = (
    accounting as any
  ).useGetAccountByIdMutation()
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory)
  const formInitialValues = useMemo(
    () => ({ ...initialValues, category_identifier: defaultCategory }),
    [defaultCategory]
  )

  useEffect(() => {
    if (isOpen && editId) {
      getAccountById({ id: editId })
    }
    if (isOpen && !editId) {
      setSelectedCategory(defaultCategory)
    }
  }, [defaultCategory, editId, getAccountById, isOpen])

  useEffect(() => {
    if (data?.data?.category_identifier) {
      setSelectedCategory(data.data.category_identifier)
    }
  }, [data?.data?.category_identifier])

  const record = data?.data
  const formValues: TransactionAccountFormValues =
    editId && record
      ? {
          name: record.name || "",
          account: record.account || "",
          category_identifier:
            record.category_identifier || initialValues.category_identifier,
          sub_category_id: record.sub_category_id
            ? String(record.sub_category_id)
            : "",
          description: record.description || "",
        }
      : formInitialValues

  const parentAccounts = useMemo(
    () =>
      (accounts.data?.data || []).filter(
        (account: any) =>
          account.category_identifier === selectedCategory &&
          !account.sub_category_id &&
          String(account.id) !== String(editId || "")
      ),
    [accounts.data?.data, editId, selectedCategory]
  )

  const handleSubmit = async (values: TransactionAccountFormValues) => {
    const payLoad = {
      name: values.name,
      category_identifier: values.category_identifier,
      sub_category_id: values.sub_category_id
        ? Number(values.sub_category_id)
        : null,
      account: values.account || "",
      description: values.description || "",
    }

    if (editId) {
      const response = await editAccount({ id: editId, payLoad }).unwrap()
      showToast.success(response?.message || t("Transaction account updated successfully."))
    } else {
      const response = await createAccount(payLoad).unwrap()
      showToast.success(response?.message || t("Transaction account created successfully."))
    }

    onSuccess()
    onClose()
  }

  return (
    <DynamicForm
      key={editId || "create-transaction-account"}
      fields={buildFields(t, parentAccounts) as any}
      initialValues={formValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      onSuccess={onSuccess}
      title={editId ? t("Edit Account") : t("Create a new Account")}
      isOpen={isOpen}
      formWidth="w-[560px]"
      isLoading={Boolean(editId) && isLoading}
      onFieldChange={(name, value, values) => {
        if (name !== "category_identifier") return
        setSelectedCategory(value)
        return { ...values, category_identifier: value, sub_category_id: "" }
      }}
    />
  )
}
