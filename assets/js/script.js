// --- ধাপ ১: আপনার Firebase প্রজেক্টের কনফিগারেশন ---
const firebaseConfig = {
  apiKey: "AIzaSyC9So1K_4nv-8697OM4FJtlPlCJYslMDdw",
  authDomain: "viralhub-8c15f.firebaseapp.com",
  projectId: "viralhub-8c15f",
  storageBucket: "viralhub-8c15f.firebasestorage.app",
  messagingSenderId: "492394159834",
  appId: "1:492394159834:web:29d0761083345c968a4fe3",
  measurementId: "G-V5KHLV2GDT"
};

// --- ধাপ ২: Firebase চালু করা ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Firestore ডাটাবেস চালু করা

// --- ধাপ ৩: DOM এলিমেন্টগুলো ধরা ---
const galleryContainer = document.getElementById('gallery-container');
const loadingIndicator = document.getElementById('loading-indicator');
const searchInput = document.getElementById('search-input');
const featuredPostsContainer = document.getElementById('featured-posts-container');
const popularPostsContainer = document.getElementById('popular-posts-container');
const featuredPostsSection = document.getElementById('featured-posts');
const popularPostsSection = document.getElementById('popular-posts');

let allPosts = []; // সব পোস্ট এখানে স্টোর করা হবে

// --- ধাপ ৪: পোস্টগুলো রেন্ডার করার ফাংশন ---
function renderPosts(posts) {
    galleryContainer.innerHTML = ''; // গ্যালারি খালি করা

    if (posts.length === 0) {
        galleryContainer.innerHTML = '<p class="text-center">No posts found.</p>';
        return;
    }

    posts.forEach(post => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'col-lg-4 col-md-6 mb-4';

        const linkElement = document.createElement('a');
        linkElement.href = post.adsDirectLink;
        linkElement.target = '_blank';
        linkElement.className = 'gallery-item';

        linkElement.innerHTML = `
            <div class="gallery-item-content">
                <img src="${post.imageLink}" alt="${post.title}">
                <div class="gallery-item-title">
                    <h5>${post.title}</h5>
                    <div class="post-stats">
                        <span><i class="bi bi-eye-fill"></i> ${post.views || 0}</span>
                        <span><i class="bi bi-heart-fill"></i> ${post.likes || 0}</span>
                    </div>
                </div>
            </div>
        `;

        itemContainer.appendChild(linkElement);
        galleryContainer.appendChild(itemContainer);
    });
}

function renderHorizontalPosts(container, posts) {
    container.innerHTML = ''; // কন্টেইনার খালি করা

    if (posts.length === 0) {
        container.innerHTML = '<p class="text-center">No posts found.</p>';
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'card me-3';
        card.style.minWidth = '300px';

        card.innerHTML = `
            <a href="${post.adsDirectLink}" target="_blank" class="text-decoration-none text-dark">
                <img src="${post.imageLink}" class="card-img-top" alt="${post.title}">
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <div class="post-stats">
                        <span><i class="bi bi-eye-fill"></i> ${post.views || 0}</span>
                        <span><i class="bi bi-heart-fill"></i> ${post.likes || 0}</span>
                    </div>
                </div>
            </a>
        `;
        container.appendChild(card);
    });
}


// --- ধাপ ৫: Firestore থেকে পোস্ট এনে ওয়েবসাইটে দেখানো ---
async function fetchAndDisplayPosts() {
    try {
        const postsRef = db.collection('posts');
        const querySnapshot = await postsRef.orderBy('timestamp', 'desc').get();

        loadingIndicator.style.display = 'none';
        
        allPosts = querySnapshot.docs.map(doc => doc.data());
        renderPosts(allPosts);

        // Featured Posts (by views)
        const featuredPosts = [...allPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        renderHorizontalPosts(featuredPostsContainer, featuredPosts);

        // Popular Posts (by likes)
        const popularPosts = [...allPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);
        renderHorizontalPosts(popularPostsContainer, popularPosts);

    } catch (error) {
        console.error("Error fetching posts: ", error);
        loadingIndicator.textContent = 'পোস্ট লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
    }
}

// --- ধাপ ৬: সার্চ ফাংশনালিটি ---
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm) {
            featuredPostsSection.style.display = 'none';
            popularPostsSection.style.display = 'none';
        } else {
            featuredPostsSection.style.display = 'block';
            popularPostsSection.style.display = 'block';
        }

        const filteredPosts = allPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm)
        );
        renderPosts(filteredPosts);
    });
}

// ওয়েবসাইট লোড হওয়ার সাথে সাথে ফাংশনটি চালু করা
if (galleryContainer) {
    fetchAndDisplayPosts();
}