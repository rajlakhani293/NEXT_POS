"use client";

import { useEffect, useState } from "react";

import { PermissionGuard } from "@/components/permission-guard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UniFieldInput } from "@/components/ui/unifield-input";
import { settings } from "@/lib/api/settings";
import { PERMISSIONS } from "@/lib/permissions";
import { showToast } from "@/lib/toast";

const initialValues = {
  company: {
    name: "",
    legal_name: "",
    email: "",
    phone: "",
    gst_number: "",
    address: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
  },
  branch: {
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",
  },
};

export default function CompanySettingsPage() {
  const [values, setValues] = useState(initialValues);
  const [getProfile, profile] = (settings as any).useGetOrganizationProfileMutation();
  const [updateProfile] = (settings as any).useUpdateOrganizationProfileMutation();

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  useEffect(() => {
    const data = profile.data?.data;
    if (data) {
      setValues({
        company: { ...initialValues.company, ...(data.company || {}) },
        branch: { ...initialValues.branch, ...(data.branch || {}) },
      });
    }
  }, [profile.data]);

  const updateField = (section: "company" | "branch", name: string, value: string) => {
    setValues((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await updateProfile({ payLoad: values }).unwrap();
    showToast.success(response?.message || "Company profile updated successfully.");
  };

  return (
    <PermissionGuard permission={PERMISSIONS.settings.view}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your company and main branch details.
          </p>
        </div>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-base font-semibold">Company Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <UniFieldInput label="Company Name" required value={values.company.name} onChange={(e) => updateField("company", "name", e.target.value)} />
            <UniFieldInput label="Legal Name" value={values.company.legal_name} onChange={(e) => updateField("company", "legal_name", e.target.value)} />
            <UniFieldInput label="Email" type="email" value={values.company.email} onChange={(e) => updateField("company", "email", e.target.value)} />
            <UniFieldInput label="Phone" value={values.company.phone} onChange={(e) => updateField("company", "phone", e.target.value)} />
            <UniFieldInput label="GST Number" value={values.company.gst_number} onChange={(e) => updateField("company", "gst_number", e.target.value)} />
            <UniFieldInput label="Currency" value={values.company.currency} onChange={(e) => updateField("company", "currency", e.target.value)} />
            <div className="md:col-span-2">
              <UniFieldInput as="textarea" label="Address" value={values.company.address} onChange={(e) => updateField("company", "address", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-base font-semibold">Main Branch</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <UniFieldInput label="Branch Name" required value={values.branch.name} onChange={(e) => updateField("branch", "name", e.target.value)} />
            <UniFieldInput label="Phone" value={values.branch.phone} onChange={(e) => updateField("branch", "phone", e.target.value)} />
            <UniFieldInput label="City" value={values.branch.city} onChange={(e) => updateField("branch", "city", e.target.value)} />
            <UniFieldInput label="State" value={values.branch.state} onChange={(e) => updateField("branch", "state", e.target.value)} />
            <UniFieldInput label="Country" value={values.branch.country} onChange={(e) => updateField("branch", "country", e.target.value)} />
            <UniFieldInput label="Postal Code" value={values.branch.postal_code} onChange={(e) => updateField("branch", "postal_code", e.target.value)} />
            <div className="md:col-span-2">
              <UniFieldInput as="textarea" label="Address" value={values.branch.address} onChange={(e) => updateField("branch", "address", e.target.value)} />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={profile.isLoading}>
            {profile.isLoading ? <Spinner /> : "Save Profile"}
          </Button>
        </div>
      </form>
    </PermissionGuard>
  );
}
