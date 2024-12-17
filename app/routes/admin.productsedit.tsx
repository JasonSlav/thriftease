import React, { useState } from "react";
import { useNavigate, useLoaderData, Form } from "@remix-run/react";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const action: ActionFunction = async ({ request }) => {
    const url = new URL(request.url);
    const imageId = url.searchParams.get('id');

    if (!imageId) {
        return json({ error: "Image ID not provided" }, { status: 400 });
    }

    try {
        // Menghapus gambar dari database menggunakan Prisma
        const image = await prisma.productImage.findUnique({
            where: { id: imageId },
        });

        if (!image) {
            return json({ error: "Image not found" }, { status: 404 });
        }

        // Menghapus gambar
        await prisma.productImage.delete({
            where: { id: imageId },
        });

        return json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error(error);
        return json({ error: "Failed to delete image" }, { status: 500 });
    }
};

export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw json({ error: "ID tidak ditemukan." }, { status: 400 });

    const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
    });

    if (!product) {
        throw json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    return json({ product });
};

const UbahProdukPage = () => {
    const navigate = useNavigate();
    const { product } = useLoaderData();
    const [productState, setProductState] = useState(product);
    const [name, setName] = useState(product.name || "");
    const [price, setPrice] = useState(product.price?.toString() || "");
    const [size, setSize] = useState(product.size || "");
    const [stock, setStock] = useState(product.stock?.toString() || "");
    const [category, setCategory] = useState(product.category || "");
    const [description, setDescription] = useState(product.description || "");
    const [newImages, setNewImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isDescriptionPopupOpen, setIsDescriptionPopupOpen] = useState(false);

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("id", product.id.toString());
        formData.append("name", name);
        formData.append("price", price);
        formData.append("size", size);
        formData.append("stock", stock);
        formData.append("category", category);
        formData.append("description", description);

        newImages.forEach((image) => {
            formData.append("images[]", image);
        });

        try {
            const response = await fetch(`/api/products`, {
                method: "PUT",
                body: formData,
            });

            if (response.ok) {
                alert("Produk berhasil diperbarui!");
                navigate("/admin/productslist");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || "Gagal memperbarui produk."}`);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat memperbarui produk.");
        }
    };

    const toggleDescriptionPopup = () => {
        setIsDescriptionPopupOpen(!isDescriptionPopupOpen);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const formattedText = e.target.value
            .replace(/^- /gm, "• ")
            .replace(/\n/g, "<br/>");
        setDescription(formattedText);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImages((prev) => [...prev, ...files]);

            // Generate URL untuk preview gambar
            const newPreviews = files.map((file) => URL.createObjectURL(file));
            setPreviewUrls((prev) => [...prev, ...newPreviews]);
        }
    };

    const handleRemovePreview = (index: number) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeleteImage = async (imageId: string) => {
        try {
            const response = await fetch(`/admin/productsedit?id=${imageId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Gambar berhasil dihapus!");
                const updatedImages = product.images.filter((image) => image.id !== imageId);
                setProductState((prevState) => ({
                    ...prevState,
                    images: updatedImages,
                }));
            } else {
                const result = await response.json();
                alert(result.error || "Gagal menghapus gambar.");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            alert("Terjadi kesalahan saat menghapus gambar.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-md p-4 relative flex justify-center items-center">
                <button
                    className="absolute left-4 text-2xl text-black bg-yellow-300 w-10 h-10 rounded-full flex items-center justify-center"
                    onClick={() => navigate(-1)}
                >
                    <i className="fas fa-chevron-left" />
                </button>
                <h1 className="text-xl font-bold text-center">Ubah Produk</h1>
            </header>
            <main className="m-4">
                <Form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div className="flex flex-col items-center mb-4 mt-4">
                        <label htmlFor="imageUpload" className="text-sm text-gray-500 cursor-pointer">
                            <div className="w-24 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="imageUpload"
                                />
                                <i className="fas fa-plus text-gray-400 text-2xl"></i>
                            </div>
                        </label>
                        {/* Preview Gambar Baru */}
                        <div className="flex flex-wrap gap-4 mt-4">
                            {previewUrls.map((url, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        className="w-24 h-24 object-cover border border-gray-300 rounded-md"
                                    />
                                    <button
                                        onClick={() => handleRemovePreview(index)}
                                        className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview Gambar dari Database */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        {product.images.map((image) => (
                            <div key={image.id} className="relative">
                                <img
                                    src={image.url}
                                    alt={product.name}
                                    className="w-24 h-24 object-cover border border-gray-300 rounded-md"
                                />
                                <button
                                    onClick={() => handleDeleteImage(image.id)}
                                    className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Produk"
                        className="w-full p-2 border rounded-md"
                    />
                    <div className="flex items-center relative">
                        <div
                            className="w-full p-2 border rounded-md bg-white cursor-pointer text-gray-500"
                            onClick={toggleDescriptionPopup}
                            dangerouslySetInnerHTML={{ __html: description || "Deskripsi Produk" }}
                        ></div>
                        <i
                            className="fas fa-pen absolute right-2 text-gray-500"
                            onClick={toggleDescriptionPopup}
                            style={{ cursor: 'pointer' }}
                        ></i>
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Harga"
                            className="w-full p-2 border rounded-md"
                        />
                        <input
                            type="text"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            placeholder="Ukuran"
                            className="w-full p-2 border rounded-md"
                        />
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="Stok"
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Kategori"
                        className="w-full p-2 border rounded-md"
                    />
                    <button
                        type="submit"
                        className="w-full p-2 bg-yellow-300 text-white rounded-md"
                    >
                        Simpan Perubahan
                    </button>
                </Form>
            </main>

            {/* Description Popup */}
            {isDescriptionPopupOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg w-80 relative">
                        <button
                            onClick={toggleDescriptionPopup}
                            className="absolute top-2 right-2 text-gray-600 text-xl"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <h2 className="text-center text-lg font-semibold mb-4">
                            Masukkan Deskripsi Produk:
                        </h2>
                        <textarea
                            rows={4}
                            placeholder="Deskripsi Produk"
                            value={description.replace(/<br\/>/g, "\n")}
                            onChange={handleDescriptionChange}
                            className="w-full p-2 border rounded-md text-gray-500"
                        />
                        <button
                            onClick={toggleDescriptionPopup}
                            className="w-full p-2 mt-4 bg-yellow-300 text-white rounded-md"
                        >
                            Simpan Deskripsi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UbahProdukPage;