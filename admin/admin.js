document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const statusMessage = document.getElementById('status-message');
    const imageUploadInput = document.getElementById('image-upload');
    const postTitleInput = document.getElementById('post-title');
    const adLinkInput = document.getElementById('ad-link');
    const postViewsInput = document.getElementById('post-views');
    const postLikesInput = document.getElementById('post-likes');
    const submitPostButton = document.getElementById('submit-post-button');

    const createPostLink = document.getElementById('create-post-link');
    const recentPostsLink = document.getElementById('recent-posts-link');
    const analyticsLink = document.getElementById('analytics-link');
    const createPostSection = document.getElementById('create-post-section');
    const recentPostsSection = document.getElementById('recent-posts-section');
    const analyticsSection = document.getElementById('analytics-section');
    const recentPostsTableBody = document.getElementById('recent-posts-table-body');

    const totalVisitors = document.getElementById('total-visitors');
    const pageViews = document.getElementById('page-views');
    const bounceRate = document.getElementById('bounce-rate');

    const editPostModal = new bootstrap.Modal(document.getElementById('editPostModal'));
    const editPostId = document.getElementById('edit-post-id');
    const editPostTitle = document.getElementById('edit-post-title');
    const editAdLink = document.getElementById('edit-ad-link');
    const editPostViews = document.getElementById('edit-post-views');
    const editPostLikes = document.getElementById('edit-post-likes');
    const saveEditButton = document.getElementById('save-edit-button');

    let uploadedImageUrl = null;

    // --- Login & Logout Logic ---
    function handleLogin() {
        const correctUsername = "admin169";
        const correctPassword = "admin169";

        if (usernameInput.value === correctUsername && passwordInput.value === correctPassword) {
            loginContainer.classList.add('d-none');
            adminPanel.classList.remove('d-none');
            errorMessage.textContent = '';
            fetchAndDisplayPosts();
        } else {
            errorMessage.textContent = 'Incorrect username or password!';
        }
    }

    function handleLogout() {
        adminPanel.classList.add('d-none');
        loginContainer.classList.remove('d-none');
        usernameInput.value = '';
        passwordInput.value = '';
        document.body.classList.add('login-page-body');
    }

    // --- Analytics Data Fetching ---
    async function displayRealtimeAnalytics() {
        // Clear previous data and show loading state
        totalVisitors.textContent = 'Loading...';
        pageViews.textContent = 'Loading...';
        bounceRate.textContent = 'Loading...';

        // Remove previous error messages
        const existingError = analyticsSection.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }

        try {
            // Fetch data from the backend server
            const response = await fetch('http://localhost:3001/api/analytics');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
            }

            // Update the UI with the fetched data
            totalVisitors.textContent = data.totalVisitors || '--';
            pageViews.textContent = data.pageViews || '--';
            bounceRate.textContent = data.bounceRate || '--';

        } catch (error) {
            console.error('Could not fetch analytics data:', error);
            totalVisitors.textContent = 'Error';
            pageViews.textContent = 'Error';
            bounceRate.textContent = 'Error';

            // Display an error message in the UI
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger mt-4';
            errorDiv.textContent = `Failed to load analytics data: ${error.message}. Make sure the backend server is running and configured correctly.`;
            analyticsSection.appendChild(errorDiv);
        }
    }

    // --- Navigation ---
    createPostLink.addEventListener('click', (e) => {
        e.preventDefault();
        createPostSection.classList.remove('d-none');
        recentPostsSection.classList.add('d-none');
        analyticsSection.classList.add('d-none');
        createPostLink.classList.add('active');
        recentPostsLink.classList.remove('active');
        analyticsLink.classList.remove('active');
    });

    recentPostsLink.addEventListener('click', (e) => {
        e.preventDefault();
        recentPostsSection.classList.remove('d-none');
        createPostSection.classList.add('d-none');
        analyticsSection.classList.add('d-none');
        recentPostsLink.classList.add('active');
        createPostLink.classList.remove('active');
        analyticsLink.classList.remove('active');
    });

    analyticsLink.addEventListener('click', (e) => {
        e.preventDefault();
        createPostSection.classList.add('d-none');
        recentPostsSection.classList.add('d-none');
        analyticsSection.classList.remove('d-none');
        createPostLink.classList.remove('active');
        recentPostsLink.classList.remove('active');
        analyticsLink.classList.add('active');
        displayRealtimeAnalytics(); // Call the function to fetch real data
    });

    // --- Image Upload Logic ---
    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        statusMessage.textContent = 'Uploading image, please wait...';
        statusMessage.className = 'loading';

        const formData = new FormData();
        formData.append('image', file);
        
        const API_KEY = 'f32d4448cf110d5b2a02af6c2de067c9';
        
        fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                uploadedImageUrl = result.data.url;
                statusMessage.textContent = 'Image uploaded successfully!';
                statusMessage.className = 'success';
            } else {
                throw new Error(result.error.message);
            }
        })
        .catch(error => {
            statusMessage.textContent = 'Upload failed.';
            statusMessage.className = 'error';
            console.error('Upload Error:', error);
        });
    });

    // --- Post Submission Logic ---
    async function handlePostSubmit() {
        const postTitle = postTitleInput.value;
        const adLink = adLinkInput.value;
        const views = parseInt(postViewsInput.value, 10) || 0;
        const likes = parseInt(postLikesInput.value, 10) || 0;
        
        if (!postTitle || !adLink || !uploadedImageUrl) {
            statusMessage.textContent = 'Please fill in all fields and upload an image.';
            statusMessage.className = 'error';
            return;
        }

        const postData = {
            title: postTitle,
            imageLink: uploadedImageUrl,
            adsDirectLink: adLink,
            views: views,
            likes: likes,
            hidden: false,
            timestamp: new Date()
        };
        
        statusMessage.textContent = 'Saving post to database...';
        statusMessage.className = 'loading';

        try {
            await db.collection("posts").add(postData);
            statusMessage.textContent = 'Post saved successfully!';
            statusMessage.className = 'success';
            
            postTitleInput.value = '';
            adLinkInput.value = '';
            postViewsInput.value = '';
            postLikesInput.value = '';
            imageUploadInput.value = '';
            uploadedImageUrl = null;
            fetchAndDisplayPosts(); // Refresh the list
        } catch (error) {
            console.error("Error adding document: ", error);
            statusMessage.textContent = 'Error saving to database.';
            statusMessage.className = 'error';
        }
    }

    // --- Fetch and Display Posts ---
    async function fetchAndDisplayPosts() {
        try {
            const querySnapshot = await db.collection("posts").orderBy("timestamp", "desc").get();
            let html = '';
            let index = 1;
            querySnapshot.forEach(doc => {
                const post = doc.data();
                html += `
                    <tr>
                        <th scope="row">${index++}</th>
                        <td><img src="${post.imageLink}" alt="${post.title}" width="100"></td>
                        <td>${post.title}</td>
                        <td>${post.views}</td>
                        <td>${post.likes}</td>
                        <td>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="hide-switch-${doc.id}" ${post.hidden ? '' : 'checked'}>
                                <label class="form-check-label" for="hide-switch-${doc.id}">${post.hidden ? 'Hidden' : 'Visible'}</label>
                            </div>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-btn" data-id="${doc.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${doc.id}">Delete</button>
                        </td>
                    </tr>
                `;
            });
            recentPostsTableBody.innerHTML = html;
        } catch (error) {
            console.error("Error fetching posts: ", error);
        }
    }

    // --- Edit, Delete, Hide/Unhide Logic ---
    recentPostsTableBody.addEventListener('click', async (e) => {
        const target = e.target;

        // Edit
        if (target.classList.contains('edit-btn')) {
            const id = target.dataset.id;
            const doc = await db.collection('posts').doc(id).get();
            const post = doc.data();
            editPostId.value = id;
            editPostTitle.value = post.title;
            editAdLink.value = post.adsDirectLink;
            editPostViews.value = post.views;
            editPostLikes.value = post.likes;
            editPostModal.show();
        }

        // Delete
        if (target.classList.contains('delete-btn')) {
            const id = target.dataset.id;
            if (confirm('Are you sure you want to delete this post?')) {
                await db.collection('posts').doc(id).delete();
                fetchAndDisplayPosts();
            }
        }

        // Hide/Unhide
        if (target.id.startsWith('hide-switch-')) {
            const id = target.id.replace('hide-switch-', '');
            const checked = target.checked;
            await db.collection('posts').doc(id).update({ hidden: !checked });
            fetchAndDisplayPosts();
        }
    });

    saveEditButton.addEventListener('click', async () => {
        const id = editPostId.value;
        const updatedData = {
            title: editPostTitle.value,
            adsDirectLink: editAdLink.value,
            views: parseInt(editPostViews.value, 10) || 0,
            likes: parseInt(editPostLikes.value, 10) || 0
        };
        await db.collection('posts').doc(id).update(updatedData);
        editPostModal.hide();
        fetchAndDisplayPosts();
    });

    // --- Initial Event Listeners ---
    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    submitPostButton.addEventListener('click', handlePostSubmit);
});