import { test } from "node:test";
import assert from "node:assert/strict";
const base = process.env.DOCKET_TEST_URL || "http://127.0.0.1:3000";
async function login(role) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
    body: JSON.stringify({
      email: `${role}@docket.local`,
      password: "Docket123!",
    }),
  });
  assert.equal(res.status, 200);
  return res.headers.get("set-cookie").split(";")[0];
}
const request = (path, cookie, init = {}) =>
  fetch(`${base}/api${path}`, {
    ...init,
    headers: { Cookie: cookie, ...init.headers },
  });
test("local document lifecycle, validation, and role boundaries", async () => {
  assert.equal((await fetch(`${base}/api/me`)).status, 401);
  const admin = await login("admin");
  const employee = await login("employee");
  const head = await login("head");
  assert.equal((await request("/admin/users", employee)).status, 403);
  assert.equal((await request("/documents/doc-2", employee)).status, 404);
  assert.equal(
    (await request("/documents/doc-2/download", employee)).status,
    404,
  );
  const categories = (await (await request("/categories", admin)).json()).data;
  const departments = (
    await (await request("/admin/departments", admin)).json()
  ).data;
  const form = new FormData();
  form.set("title", "Integration check");
  form.set("categoryId", categories[0].id);
  form.set("departmentId", departments[0].id);
  form.set(
    "file",
    new Blob(["Docket test document\n"], { type: "text/plain" }),
    "test.txt",
  );
  const upload = await request("/documents/uploads", admin, {
    method: "POST",
    body: form,
  });
  assert.equal(upload.status, 201);
  const doc = (await upload.json()).data;
  try {
    assert.equal((await request(`/documents/${doc.id}`, admin)).status, 200);
    assert.equal(
      (
        await request(`/documents/${doc.id}`, employee, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
          body: JSON.stringify({
            title: "Unauthorized",
            categoryId: categories[0].id,
          }),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(`/documents/${doc.id}`, head, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
          body: JSON.stringify({
            title: "Updated by department head",
            categoryId: categories[0].id,
          }),
        })
      ).status,
      200,
    );
    const updated = (
      await (await request(`/documents/${doc.id}`, admin)).json()
    ).data;
    assert.equal(updated.title, "Updated by department head");
    assert.equal(
      await (await request(`/documents/${doc.id}/download`, employee)).text(),
      "Docket test document\n",
    );
    const search = await (
      await request("/documents?q=Updated%20by%20department%20head", admin)
    ).json();
    assert.equal(search.pagination.total, 1);
    const bad = new FormData();
    bad.set("file", new Blob(["not a pdf"]), "bad.pdf");
    assert.equal(
      (
        await request("/documents/uploads", admin, {
          method: "POST",
          body: bad,
        })
      ).status,
      415,
    );
    assert.equal(
      (
        await request("/categories", admin, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://foreign.example",
          },
          body: JSON.stringify({ name: "Should fail" }),
        })
      ).status,
      403,
    );
  } finally {
    assert.equal(
      (await request(`/documents/${doc.id}`, admin, { method: "DELETE" }))
        .status,
      204,
    );
  }
  assert.equal((await request(`/documents/${doc.id}`, admin)).status, 404);
  await request("/auth/logout", employee, { method: "POST" });
  assert.equal((await request("/me", employee)).status, 401);
});
test("administrator reference records and account creation", async () => {
  const admin = await login("admin");
  const suffix = Date.now();
  for (const endpoint of ["/categories", "/admin/departments"]) {
    const created = await request(endpoint, admin, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
      body: JSON.stringify({ name: `Test ${suffix}` }),
    });
    assert.equal(created.status, 201);
    const item = (await created.json()).data;
    try {
      assert.equal(
        (
          await request(`${endpoint}/${item.id}`, admin, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
            body: JSON.stringify({ name: `Renamed ${suffix}` }),
          })
        ).status,
        200,
      );
    } finally {
      assert.equal(
        (await request(`${endpoint}/${item.id}`, admin, { method: "DELETE" }))
          .status,
        204,
      );
    }
  }
  const created = await request("/admin/users", admin, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
    body: JSON.stringify({
      name: "Test account",
      email: `test-${suffix}@docket.local`,
      password: "TestPassword123!",
      role: "EMPLOYEE",
      departmentId: "dep-hr",
    }),
  });
  assert.equal(created.status, 201);
  const user = (await created.json()).data;
  assert.equal(user.passwordHash, undefined);
  assert.equal(
    (
      await request(`/admin/users/${user.id}`, admin, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
        body: JSON.stringify({ isActive: false }),
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/admin/users/user-admin", admin, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Origin: new URL(base).origin },
        body: JSON.stringify({ isActive: false }),
      })
    ).status,
    409,
  );
});

