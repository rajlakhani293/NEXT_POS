"use client";

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form";
import { CatalogPageShell } from "@/components/catalog/catalog-page-shell";
import { settings } from "@/lib/api/settings";
import { PERMISSIONS } from "@/lib/permissions";

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "phone", title: "Phone" },
  { key: "city", title: "City" },
  { key: "state", title: "State" },
];

const initialValues = {
  name: "",
  code: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",
};

function BranchForm(props: any) {
  return (
    <CatalogMasterForm
      {...props}
      entityName="Branch"
      fields={[
        { name: "name", label: "Branch Name", type: "text", required: true },
        { name: "code", label: "Code", type: "text", placeholder: "Auto generate if blank" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "address", label: "Address", type: "textarea", rows: 3 },
        { name: "city", label: "City", type: "text" },
        { name: "state", label: "State", type: "text" },
        { name: "country", label: "Country", type: "text" },
        { name: "postal_code", label: "Postal Code", type: "text" },
      ]}
      initialValues={initialValues}
      createHook={(settings as any).useCreateBranchMutation}
      editHook={(settings as any).useEditBranchMutation}
      getByIdHook={(settings as any).useGetBranchByIdMutation}
    />
  );
}

export default function BranchesPage() {
  return (
    <CatalogPageShell
      tableTitle="Branches"
      addTitle="Add Branch"
      columns={columns}
      getDataHook={(settings as any).useGetBranchesDataMutation}
      deleteHook={(settings as any).useDeleteBranchMutation}
      statusHook={(settings as any).useUpdateBranchStatusMutation}
      FormComponent={BranchForm}
      deleteTitle="Delete Branch"
      deleteDescription="Are you sure you want to delete this branch?"
      permissions={PERMISSIONS.branches}
    />
  );
}
