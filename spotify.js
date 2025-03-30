async function getSpotifyToken(clientId, clientSecret) {
    // Encode credentials in base64
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting Spotify token:', error);
        throw error;
    }
}

// Usage example
const clientId = '351263eb24e940f0a10d4340245e2819';
const clientSecret = '68fdf75a9915401ab623897f43002be3';

// Call the function
getSpotifyToken(clientId, clientSecret)
    .then(token => {
        console.log('Access token:', token);
        getNewReleases(token, 50); // Lấy 50 album mới nhất
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('albumsContainer').innerHTML = 'Lỗi khi lấy token';
    });

// Cấu hình Spotify

// Hàm lấy thông tin nghệ sĩ từ API

// Hàm hiển thị thông tin nghệ sĩ

// Hàm lấy thông tin album từ API
async function getAlbum(token, albumId) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayAlbum(data);
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('albumContainer').innerHTML = 'Có lỗi xảy ra khi tải dữ liệu album';
    }
}

// Hàm hiển thị thông tin album
function displayAlbum(album) {
    const container = document.getElementById('albumContainer');
    
    const imageUrl = album.images && album.images.length > 0 
        ? album.images[0].url 
        : 'https://via.placeholder.com/200';

    const html = `
        <div class="album-card">
            <img class="album-image" src="${imageUrl}" alt="${album.name}">
            <h2>${album.name || 'Unknown Album'}</h2>
            <div class="album-info">
                <p>Artist: ${album.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist'}</p>
                <p>Release Date: ${album.release_date || 'N/A'}</p>
                <p>Total Tracks: ${album.total_tracks || '0'}</p>
                <p>Popularity: ${album.popularity || '0'}/100</p>
            </div>
            <div class="tracks-list">
                <h3>Tracks:</h3>
                <ul>
                    ${album.tracks?.items?.map(track => `
                        <li>${track.name} - ${Math.floor(track.duration_ms/60000)}:${((track.duration_ms % 60000)/1000).toFixed(0).padStart(2, '0')}</li>
                    `).join('') || 'No tracks available'}
                </ul>
            </div>
            <a href="${album.external_urls?.spotify || '#'}" target="_blank">
                Nghe trên Spotify
            </a>
        </div>
    `;
    
    container.innerHTML = html;
}

// Hàm tìm kiếm album theo tên
async function searchAlbumsByName(token, searchTerm) {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=album&limit=50`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayAlbums(data.albums.items);
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('albumsContainer').innerHTML = 'Có lỗi xảy ra khi tìm kiếm album';
    }
}

// Cập nhật lại hàm searchAlbum
function searchAlbum() {
    const searchTerm = document.getElementById('albumInput').value;
    if (searchTerm) {
        document.getElementById('albumsContainer').innerHTML = '<p>Đang tìm kiếm...</p>';
        getSpotifyToken(clientId, clientSecret)
            .then(token => {
                searchAlbumsByName(token, searchTerm);
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('albumsContainer').innerHTML = 'Lỗi khi lấy token';
            });
    }
}

// Thêm debounce function để tránh gọi API quá nhiều
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Tạo hàm search với debounce
const debouncedSearch = debounce(() => {
    searchAlbum();
}, 500);

// Hàm lấy nhiều album mới
async function getNewReleases(token, limit = 50) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/browse/new-releases?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayAlbums(data.albums.items);
    } catch (error) {
        console.error('Lỗi:', error);
        document.getElementById('albumsContainer').innerHTML = 'Có lỗi xảy ra khi tải danh sách album';
    }
}

// Hàm hiển thị danh sách album
function displayAlbums(albums) {
    const container = document.getElementById('albumsContainer');
    
    const html = `
        <div class="albums-grid">
            ${albums.map(album => `
                <div class="album-card">
                    <img class="album-image" 
                         src="${album.images[0]?.url || 'https://via.placeholder.com/200'}" 
                         alt="${album.name}">
                    <h3>${album.name}</h3>
                    <p class="artist-name">${album.artists.map(artist => artist.name).join(', ')}</p>
                    <p class="release-date">Phát hành: ${new Date(album.release_date).toLocaleDateString()}</p>
                    <a href="${album.external_urls.spotify}" target="_blank" class="spotify-link">
                        Nghe trên Spotify
                    </a>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}
