import { useState, useEffect, useRef } from 'react';
import { Card, Space, Button, Table, Tag, Upload, Progress, Row, Col, Input, Modal, message, Breadcrumb, Tooltip, FloatButton, Menu, Radio, Alert, List, Typography } from 'antd';
import {
    FolderOutlined,
    FileOutlined,
    UploadOutlined,
    DownloadOutlined,
    DeleteOutlined,
    EditOutlined,
    SearchOutlined,
    ReloadOutlined,
    LoadingOutlined,
    CloseCircleOutlined,
    CheckCircleOutlined,
    PushpinOutlined,
    PushpinFilled,
    VerticalAlignTopOutlined,
    LeftOutlined,
    RightOutlined,
    ScissorOutlined,
    CopyOutlined,
    SnippetsOutlined,
    CompressOutlined,
    FolderOpenOutlined,
    UpOutlined,
    DownOutlined,
    CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr'; // Türkçe desteği

const { Search } = Input;
const { Dragger } = Upload;

// date-fns yerine dayjs kullanalım
dayjs.extend(relativeTime);
dayjs.locale('tr');

function FilesPage({ isDarkMode }) {
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortedInfo, setSortedInfo] = useState({});
    const [uploadingFiles, setUploadingFiles] = useState([]);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [newFileName, setNewFileName] = useState('');
    const [diskMetrics, setDiskMetrics] = useState([]);
    const [favorites, setFavorites] = useState(() => {
        const savedFavorites = localStorage.getItem('fileFavorites');
        return savedFavorites ? JSON.parse(savedFavorites) : [
            {
                name: 'Apache Siteleri',
                path: '/etc/apache2/sites-available',
                icon: 'fa-solid fa-globe'
            },
            {
                name: 'Web Siteleri',
                path: '/etc/www-sites',
                icon: 'fa-solid fa-folder-tree'
            }
        ];
    });
    const ftpTableRef = useRef(null);
    const [pathHistory, setPathHistory] = useState(['/']);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [selectedContextItem, setSelectedContextItem] = useState(null);
    const [clipboard, setClipboard] = useState(null);
    const [extractPathModalVisible, setExtractPathModalVisible] = useState(false);
    const [extractPath, setExtractPath] = useState('');
    const [pasteButtonVisible, setPasteButtonVisible] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [shiftStartIndex, setShiftStartIndex] = useState(null);
    const [lastClickTime, setLastClickTime] = useState(0); // Çift tıklama için
    const [showDetails, setShowDetails] = useState(true);
    const [compressModalVisible, setCompressModalVisible] = useState(false);
    const [compressFormat, setCompressFormat] = useState('zip');
    const [conflictModalVisible, setConflictModalVisible] = useState(false);
    const [conflicts, setConflicts] = useState([]);
    const [extractOptions, setExtractOptions] = useState({
        overwriteExisting: false,
        keepBoth: false
    });

    useEffect(() => {
        fetchFiles(currentPath);
        fetchDiskMetrics();
        // Sayfa değiştiğinde seçimleri temizle
        setSelectedFiles([]);
        setClipboard(null);
        setContextMenuVisible(false);
    }, [currentPath]); // currentPath değiştiğinde tetiklenecek

    // Scroll event listener
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Sağ tık menüsünü kapatmak için click handler ekleyelim
    useEffect(() => {
        const handleClick = () => setContextMenuVisible(false);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Clipboard değiştiğinde yapıştır butonunu göster
    useEffect(() => {
        if (clipboard) {
            setPasteButtonVisible(true);
        } else {
            setPasteButtonVisible(false);
        }
    }, [clipboard]);

    // Favoriler değiştiğinde localStorage'a kaydet
    useEffect(() => {
        localStorage.setItem('fileFavorites', JSON.stringify(favorites));
    }, [favorites]);

    const fetchFiles = async (path) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/ftp/list?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            setFiles(data);
        } catch (error) {
            message.error('Dosyalar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const fetchDiskMetrics = async () => {
        try {
            const response = await fetch('/api/servermetrics/disk');
            const data = await response.json();
            // Boyuta göre sırala (büyükten küçüğe)
            const sortedData = data.sort((a, b) => {
                const totalA = parseFloat(a.total.replace(/[^0-9,.]/g, ''));
                const totalB = parseFloat(b.total.replace(/[^0-9,.]/g, ''));
                return totalB - totalA;
            });
            setDiskMetrics(sortedData);
        } catch (error) {
            message.error('Disk metrikleri alınamadı');
        }
    };

    const handleUpload = async ({ file, onProgress }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);

        const uploadingFile = {
            id: Date.now(),
            name: file.name,
            progress: 0,
            status: 'uploading'
        };

        setUploadingFiles(prev => [...prev, uploadingFile]);
        setUploadModalVisible(true);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/ftp/upload', true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded * 100) / event.total);
                    onProgress({ percent });
                    setUploadingFiles(prev =>
                        prev.map(f =>
                            f.id === uploadingFile.id ? { ...f, progress: percent } : f
                        )
                    );
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setUploadingFiles(prev =>
                        prev.map(f =>
                            f.id === uploadingFile.id ? { ...f, status: 'success' } : f
                        )
                    );
                    message.success(`${file.name} başarıyla yüklendi`);
                    fetchFiles(currentPath);
                } else {
                    setUploadingFiles(prev =>
                        prev.map(f =>
                            f.id === uploadingFile.id ? { ...f, status: 'error' } : f
                        )
                    );
                    message.error(`${file.name} yüklenemedi`);
                }
            };

            xhr.send(formData);
        } catch (error) {
            message.error(`${file.name} yüklenirken hata oluştu`);
        }
    };

    const handleDownload = async (path, filename) => {
        try {
            const response = await fetch(`/api/ftp/download?path=${encodeURIComponent(path)}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            message.error('Dosya indirilirken hata oluştu');
        }
    };

    const handleDelete = async (path) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/ftp/file?path=${encodeURIComponent(path)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                message.success('Dosya başarıyla silindi');
                fetchFiles(currentPath);
            } else {
                throw new Error('Dosya silinemedi');
            }
        } catch (error) {
            message.error('Dosya silinirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleRename = async () => {
        if (!selectedFile || !newFileName) return;

        const oldPath = selectedFile.path;
        const newPath = `${currentPath}/${newFileName}`;

        try {
            setLoading(true);
            const response = await fetch(
                `/api/ftp/rename?oldPath=${encodeURIComponent(oldPath)}&newPath=${encodeURIComponent(newPath)}`,
                { method: 'POST' }
            );

            if (response.ok) {
                message.success('Dosya adı başarıyla değiştirildi');
                fetchFiles(currentPath);
                setRenameModalVisible(false);
            } else {
                throw new Error('Dosya adı değiştirilemedi');
            }
        } catch (error) {
            message.error('Dosya adı değiştirilirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const addToFavorites = (path, name) => {
        if (!favorites.find(f => f.path === path)) {
            setFavorites([...favorites, { path, name }]);
            message.success('Favorilere eklendi');
        }
    };

    const removeFromFavorites = (path) => {
        setFavorites(favorites.filter(f => f.path !== path));
        message.success('Favorilerden çıkarıldı');
    };

    // Favori tıklama işleyicisini güncelleyelim
    const handleFavoriteClick = (path) => {
        setCurrentPath(path);
        // Kısa bir gecikme ile scroll işlemini yap
        setTimeout(() => {
            const tableElement = document.querySelector('.ant-table-wrapper');
            if (tableElement) {
                tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Navigasyon geçmişini güncelle
    const updatePathHistory = (newPath) => {
        setPathHistory(prev => {
            const newHistory = prev.slice(0, currentHistoryIndex + 1);
            return [...newHistory, newPath];
        });
        setCurrentHistoryIndex(prev => prev + 1);
    };

    // İleri git
    const goForward = () => {
        if (currentHistoryIndex < pathHistory.length - 1) {
            setCurrentHistoryIndex(prev => prev + 1);
            setCurrentPath(pathHistory[currentHistoryIndex + 1]);
        }
    };

    // Geri git
    const goBack = () => {
        if (currentHistoryIndex > 0) {
            setCurrentHistoryIndex(prev => prev - 1);
            setCurrentPath(pathHistory[currentHistoryIndex - 1]);
        }
    };

    // Dosyaları sırala (önce klasörler, sonra dosyalar)
    const sortFiles = (files) => {
        return files
            .filter(file => !['..', '.'].includes(file.name)) // . ve .. dosyalarını filtrele
            .sort((a, b) => {
                // Önce klasör/dosya ayrımı
                if (a.type !== b.type) {
                    return a.type === 'directory' ? -1 : 1;
                }
                // Aynı tipse boyuta göre sırala (büyükten küçüğe)
                if (a.type === 'file') {
                    const sizeA = parseFloat(a.size);
                    const sizeB = parseFloat(b.size);
                    return sizeB - sizeA;
                }
                // Klasörler için alfabetik sıralama
                return a.name.localeCompare(b.name);
            });
    };

    // Sağ tık menüsünü göster
    const handleContextMenu = (e, record) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('Context Menu Record:', record); // Debug için

        if (!record) return;

        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuVisible(true);
        setSelectedContextItem(record);
    };

    // Dosya/Klasör işlemleri
    const handleCut = () => {
        setClipboard({ type: 'cut', item: selectedContextItem });
        setContextMenuVisible(false);
    };

    const handleCopy = () => {
        setClipboard({ type: 'copy', item: selectedContextItem });
        setContextMenuVisible(false);
    };

    const handlePaste = async () => {
        if (!clipboard) return;

        try {
            setLoading(true);
            const response = await fetch('/api/ftp/paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourcePaths: clipboard.sourcePaths,
                    destinationPath: currentPath,
                    operation: clipboard.type
                })
            });

            if (!response.ok) throw new Error('Yapıştırma işlemi başarısız');

            message.success(`${clipboard.items.length} öğe başarıyla yapıştırıldı`);
            fetchFiles(currentPath);
            if (clipboard.type === 'cut') {
                setClipboard(null); // Sadece kesme işleminde clipboard'ı temizle
            }
        } catch (error) {
            message.error('Yapıştırma işlemi sırasında hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleCompress = async (format) => {
        try {
            setLoading(true);

            // Sıkıştırılacak dosyaların yollarını topla
            const filesToCompress = selectedFiles.length > 0
                ? selectedFiles.map(file => file.path)
                : [selectedContextItem.path];

            const response = await fetch('/api/ftp/compress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: filesToCompress,
                    format: format,
                    targetPath: currentPath // Mevcut dizinde sıkıştır
                })
            });

            if (!response.ok) {
                throw new Error('Sıkıştırma işlemi başarısız oldu');
            }

            message.success('Dosyalar başarıyla sıkıştırıldı');
            setCompressModalVisible(false);
            fetchFiles(currentPath); // Listeyi yenile
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExtract = async (destinationPath = currentPath, fileToExtract = null) => {
        // Hangi dosyanın işleneceğini belirle
        const targetFile = fileToExtract || selectedContextItem;

        console.log('Target File:', targetFile);
        console.log('Is Archive:', isArchive(targetFile?.name));

        if (!targetFile?.path) {
            message.error('Lütfen bir arşiv dosyası seçin');
            return;
        }

        if (!isArchive(targetFile.name)) {
            message.error('Seçilen dosya bir arşiv dosyası değil');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/ftp/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    archivePath: targetFile.path,
                    destinationPath: destinationPath,
                    overwriteExisting: extractOptions.overwriteExisting,
                    keepBoth: extractOptions.keepBoth
                })
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Arşiv başarıyla çıkarıldı');
                setExtractPathModalVisible(false);
                setConflictModalVisible(false);
                fetchFiles(currentPath);
            } else if (response.status === 409) { // Çakışma durumu
                setConflicts(data.conflicts);
                setConflictModalVisible(true);
            } else {
                throw new Error(data.message || 'Arşiv çıkarma işlemi başarısız oldu');
            }
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Dosya tıklama işleyicisi
    const handleFileClick = (record, index, event) => {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastClickTime;

        // Çift tıklama kontrolü (300ms içinde)
        if (timeDiff < 300) {
            // Çift tıklama - klasöre gir veya dosyayı indir
            if (record.type === 'directory') {
                setCurrentPath(record.path);
            } else {
                handleDownload(record.path, record.name);
            }
        } else {
            // Tek tıklama - seçim işlemi
            handleFileSelect(record, index, event);
        }
        setLastClickTime(currentTime);
    };

    // Dosya seçim işleyicisi
    const handleFileSelect = (record, index, event) => {
        if (event.ctrlKey || event.metaKey) { // Ctrl/Cmd ile çoklu seçim
            setSelectedFiles(prev => {
                const isSelected = prev.some(f => f.path === record.path);
                if (isSelected) {
                    return prev.filter(f => f.path !== record.path);
                }
                return [...prev, record];
            });
        } else if (event.shiftKey && shiftStartIndex !== null) { // Shift ile aralık seçimi
            const start = Math.min(shiftStartIndex, index);
            const end = Math.max(shiftStartIndex, index);
            const selectedRange = sortFiles(files)
                .slice(start, end + 1);
            setSelectedFiles(selectedRange);
        } else { // Tekli seçim
            setSelectedFiles([record]);
            setShiftStartIndex(index);
        }
    };

    // Çoklu silme işlemi
    const handleBulkDelete = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/ftp/paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourcePaths: selectedFiles.map(f => f.path),
                    operation: 'delete'
                })
            });

            if (!response.ok) throw new Error('Silme işlemi başarısız');
            message.success(`${selectedFiles.length} öğe başarıyla silindi`);
            fetchFiles(currentPath);
            setSelectedFiles([]);
        } catch (error) {
            message.error('Silme işlemi sırasında hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Çoklu kopyalama/taşıma işlemi
    const handleBulkCopy = async (type) => {
        setClipboard({
            type,
            items: selectedFiles,
            sourcePaths: selectedFiles.map(f => f.path)
        });
        message.success(`${selectedFiles.length} öğe ${type === 'cut' ? 'kesildi' : 'kopyalandı'}`);
    };

    const columns = [
        {
            title: 'Ad',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
            render: (text, record, index) => (
                <div
                    onContextMenu={(e) => handleContextMenu(e, record)}
                    onClick={(e) => handleFileClick(record, index, e)}
                    className={`file-item ${clipboard?.items?.some(f => f.path === record.path)
                        ? clipboard.type === 'cut'
                            ? 'cut-item'
                            : 'copied-item'
                        : ''
                        } ${selectedFiles.some(f => f.path === record.path) ? 'selected-item' : ''}`}
                    style={{ cursor: 'pointer' }} // İmleç stilini pointer yap
                >
                    <Space>
                        {record.type === 'directory' ?
                            <FolderOutlined style={{ color: '#1677ff' }} /> :
                            <FileOutlined style={{ color: '#52c41a' }} />
                        }
                        <span>{text}</span>
                    </Space>
                </div>
            ),
        },
        {
            title: 'Boyut',
            dataIndex: 'size',
            key: 'size',
            sorter: (a, b) => {
                const sizeA = parseFloat(a.size);
                const sizeB = parseFloat(b.size);
                return sizeA - sizeB;
            },
            sortOrder: sortedInfo.columnKey === 'size' && sortedInfo.order,
        },
        {
            title: 'İzinler',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (permissions) => <Tag>{permissions}</Tag>,
        },
        {
            title: 'Son Değişiklik',
            dataIndex: 'modified',
            key: 'modified',
            sorter: (a, b) => new Date(a.modified) - new Date(b.modified),
            sortOrder: sortedInfo.columnKey === 'modified' && sortedInfo.order,
            render: (date) => dayjs(date).fromNow(),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.type === 'file' && (
                        <Button
                            icon={<DownloadOutlined />}
                            size="small"
                            onClick={() => handleDownload(record.path, record.name)}
                        />
                    )}
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => {
                            setSelectedFile(record);
                            setNewFileName(record.name);
                            setRenameModalVisible(true);
                        }}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => Modal.confirm({
                            title: 'Silme Onayı',
                            content: `${record.name} silinecek. Emin misiniz?`,
                            okText: 'Evet',
                            cancelText: 'Hayır',
                            onOk: () => handleDelete(record.path)
                        })}
                    />
                </Space>
            ),
        },
    ];

    const pathParts = currentPath.split('/').filter(Boolean);

    // Modal kapatma işleyicisini güncelleyelim
    const handleModalClose = () => {
        setUploadModalVisible(false);
        setUploadingFiles([]);
        setSelectedFiles([]); // Seçili dosyaları temizle
        setClipboard(null); // Clipboard'ı temizle
    };

    // Favori kontrolü için fonksiyon
    const isFavorite = (path) => {
        return favorites.some(fav => fav.path === path);
    };

    // Favorilere ekleme/çıkarma fonksiyonu
    const toggleFavorite = (path, name) => {
        if (isFavorite(path)) {
            setFavorites(prev => {
                const newFavorites = prev.filter(fav => fav.path !== path);
                return newFavorites;
            });
            message.success('Favorilerden çıkarıldı');
        } else {
            setFavorites(prev => {
                const newFavorites = [...prev, {
                    path,
                    name: name || path.split('/').pop() || 'Root',
                    icon: 'fa-solid fa-folder'
                }];
                return newFavorites;
            });
            message.success('Favorilere eklendi');
        }
    };

    // İleri-geri butonlarını kaldırdık
    const toolbarConfig = {
        toolbar: {
            buttons: {
                // İleri-geri butonlarını kaldırdık
                // forward: true,
                // back: true,
                delete: true,
                rename: true,
                download: true,
                upload: true,
                createFolder: true,
                refresh: true,
            }
        }
    };

    // Arşiv dosyası kontrolü için yardımcı fonksiyon
    const isArchive = (filename) => {
        if (!filename) return false;
        const archiveExtensions = /\.(zip|tar|gz|tgz|bz2|targz|tarbz2)$/i;
        const result = archiveExtensions.test(filename);
        console.log('isArchive check for:', filename, 'Result:', result); // Debug için
        return result;
    };

    return (
        <div className="page-container">
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {/* Disk Metrikleri */}
                <Col span={12}>
                    <Card title="Bağlı Diskler" size="small">
                        {diskMetrics.map((disk) => (
                            <div key={disk.mountPoint} style={{ marginBottom: 12 }}>
                                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                                    <Tooltip title={`Device: ${disk.device}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{disk.mountPoint}</span>
                                            <span>{disk.total}</span>
                                        </div>
                                    </Tooltip>
                                    <Progress
                                        percent={Math.round(disk.usagePercentage * 100) / 100}
                                        size="small"
                                        status={disk.usagePercentage > 90 ? 'exception' : 'normal'}
                                        format={(percent) => (
                                            <span style={{ fontSize: '12px' }}>
                                                {`${disk.used} / ${disk.free} (${percent}%)`}
                                            </span>
                                        )}
                                    />
                                </Space>
                            </div>
                        ))}
                    </Card>
                </Col>

                {/* Favoriler ve Yapıştır Butonu */}
                <Col span={12} style={{ display: 'flex', gap: '16px' }}>
                    <Card
                        title="Favori Konumlar"
                        size="small"
                        style={{ flex: 1 }}
                        extra={
                            <Button
                                type="text"
                                icon={<PushpinOutlined />}
                                onClick={() => addToFavorites(currentPath, currentPath.split('/').pop() || 'Root')}
                            >
                                Ekle
                            </Button>
                        }
                    >
                        {favorites.map((fav) => (
                            <div
                                key={fav.path}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f0f0f0'
                                }}
                            >
                                <span
                                    onClick={() => handleFavoriteClick(fav.path)}
                                    style={{ flex: 1 }}
                                >
                                    <FolderOutlined style={{ marginRight: 8 }} />
                                    {fav.name}
                                </span>
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromFavorites(fav.path);
                                    }}
                                />
                            </div>
                        ))}
                    </Card>

                    {/* Yapıştır Butonu */}
                    {clipboard && (
                        <Card
                            size="small"
                            className={`paste-card ${pasteButtonVisible ? 'pulse' : ''}`}
                            style={{ width: '120px' }}
                        >
                            <Button
                                type="primary"
                                icon={<SnippetsOutlined />}
                                onClick={handlePaste}
                                style={{ width: '100%' }}
                            >
                                Yapıştır
                                <br />
                                <small style={{ fontSize: '11px' }}>
                                    {clipboard.items?.length || 1} öğe
                                </small>
                            </Button>
                        </Card>
                    )}
                </Col>
            </Row>

            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Space style={{ marginBottom: 16 }}>
                            <Breadcrumb
                                items={[
                                    { title: <a onClick={() => setCurrentPath('/')}><FolderOutlined /> Root</a> },
                                    ...pathParts.map((part, index) => ({
                                        title: (
                                            <a onClick={() => setCurrentPath('/' + pathParts.slice(0, index + 1).join('/'))}>
                                                {part}
                                            </a>
                                        )
                                    }))
                                ]}
                            />
                        </Space>

                        <Space style={{ marginBottom: 16 }}>
                            <Search
                                placeholder="Dosya ara..."
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 200 }}
                            />
                            <Upload
                                customRequest={handleUpload}
                                showUploadList={false}
                                multiple
                            >
                                <Button icon={<UploadOutlined />}>Dosya Yükle</Button>
                            </Upload>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => fetchFiles(currentPath)}
                                loading={loading}
                            >
                                Yenile
                            </Button>
                            <Button
                                icon={isFavorite(currentPath) ? <PushpinFilled /> : <PushpinOutlined />}
                                onClick={() => toggleFavorite(currentPath, currentPath.split('/').pop() || 'Root')}
                                type={isFavorite(currentPath) ? 'primary' : 'default'}
                            >
                                {isFavorite(currentPath) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                            </Button>
                        </Space>

                        <Table
                            columns={columns}
                            dataSource={sortFiles(files).filter(file =>
                                file.name.toLowerCase().includes(searchText.toLowerCase())
                            )}
                            loading={loading}
                            onChange={(pagination, filters, sorter) => {
                                setSortedInfo(sorter);
                            }}
                            pagination={false}
                            rowClassName={(record) => {
                                return record.name.startsWith('.') ? 'hidden-file' : '';
                            }}
                        />
                    </Space>
                </Card>
            </Space>

            <Modal
                title="Dosya Yüklemeleri"
                open={uploadModalVisible}
                onCancel={handleModalClose}
                footer={null}
            >
                {uploadingFiles.map(file => (
                    <div key={file.id} style={{ marginBottom: 16 }}>
                        <Space>
                            {file.status === 'uploading' && <LoadingOutlined />}
                            {file.status === 'success' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            {file.status === 'error' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            <span>{file.name}</span>
                        </Space>
                        <Progress percent={file.progress} size="small" status={file.status} />
                    </div>
                ))}
            </Modal>

            <Modal
                title="Yeniden Adlandır"
                open={renameModalVisible}
                onOk={handleRename}
                onCancel={() => setRenameModalVisible(false)}
                confirmLoading={loading}
            >
                <Input
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    placeholder="Yeni dosya adı"
                />
            </Modal>

            {showScrollTop && (
                <FloatButton.Group shape="circle" style={{ right: 24 }}>
                    {clipboard && (
                        <FloatButton
                            type="primary"
                            icon={<SnippetsOutlined />}
                            tooltip={`${clipboard.items.length} öğeyi yapıştır`}
                            onClick={handlePaste}
                            className="floating-paste-button"
                            description="Yapıştır"
                        />
                    )}
                    <FloatButton
                        icon={<VerticalAlignTopOutlined />}
                        tooltip="Yukarı Çık"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    />
                </FloatButton.Group>
            )}

            {/* Sağ Tık Menüsü */}
            {contextMenuVisible && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenuPosition.y,
                        left: contextMenuPosition.x,
                        background: 'var(--component-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '2px',
                        padding: '4px 0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 1000
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <Menu mode="vertical" theme={isDarkMode ? 'dark' : 'light'}>
                        <Menu.Item key="cut" onClick={handleCut}>
                            <ScissorOutlined /> Kes
                        </Menu.Item>
                        <Menu.Item key="copy" onClick={handleCopy}>
                            <CopyOutlined /> Kopyala
                        </Menu.Item>
                        {clipboard && (
                            <Menu.Item key="paste" onClick={handlePaste}>
                                <SnippetsOutlined /> Yapıştır
                            </Menu.Item>
                        )}
                        <Menu.Divider />
                        <Menu.Item
                            key="rename"
                            onClick={() => {
                                setSelectedFile(selectedContextItem);
                                setNewFileName(selectedContextItem.name);
                                setRenameModalVisible(true);
                                setContextMenuVisible(false);
                            }}
                        >
                            <EditOutlined /> Yeniden Adlandır
                        </Menu.Item>

                        {/* Klasör veya arşiv kontrolü */}
                        {selectedContextItem?.type === 'directory' ? (
                            <Menu.Item key="compress" onClick={() => setCompressModalVisible(true)}>
                                <CompressOutlined /> Sıkıştır
                            </Menu.Item>
                        ) : selectedContextItem?.type === 'file' && isArchive(selectedContextItem?.name) ? (
                            <Menu.SubMenu
                                key="extract"
                                icon={<FolderOpenOutlined />}
                                title="Arşivi Aç"
                                disabled={false}
                            >
                                <Menu.Item key="extractHere" onClick={() => handleExtract()}>
                                    Buraya Aç
                                </Menu.Item>
                                <Menu.Item key="extractTo" onClick={() => setExtractPathModalVisible(true)}>
                                    Farklı Konuma Aç...
                                </Menu.Item>
                            </Menu.SubMenu>
                        ) : (
                            <Menu.Item key="compress" onClick={() => setCompressModalVisible(true)}>
                                <CompressOutlined /> Sıkıştır
                            </Menu.Item>
                        )}

                        <Menu.Divider />
                        <Menu.Item key="delete" danger onClick={() => handleDelete(selectedContextItem.path)}>
                            <DeleteOutlined /> Sil
                        </Menu.Item>
                    </Menu>
                </div>
            )}

            {/* Çıkartma Yolu Modal */}
            <Modal
                title="Çıkartma Konumu"
                open={extractPathModalVisible}
                onOk={() => handleExtract(extractPath)}
                onCancel={() => setExtractPathModalVisible(false)}
            >
                <Input
                    value={extractPath}
                    onChange={(e) => setExtractPath(e.target.value)}
                    placeholder="Örn: /var/www/html"
                    prefix={<FolderOutlined />}
                />
            </Modal>

            {/* Yüzen İşlem Menüsü */}
            {selectedFiles.length > 0 && (
                <div className="floating-menu">
                    <div className="selected-files-info">
                        <div className="menu-header">
                            <div className="left-section">
                                <Button
                                    type="text"
                                    icon={showDetails ? <UpOutlined /> : <DownOutlined />}
                                    onClick={() => setShowDetails(!showDetails)}
                                />
                                <span className="files-count">
                                    {selectedFiles.length} öğe seçili
                                </span>
                            </div>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={() => setSelectedFiles([])}
                            />
                        </div>

                        {showDetails && (
                            <>
                                <div className="files-details">
                                    {selectedFiles.map(file => (
                                        <div key={file.path} className="file-detail">
                                            <span>{file.name}</span>
                                            <span>{file.size}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="action-buttons">
                                    <Button icon={<ScissorOutlined />} onClick={() => handleBulkCopy('cut')}>
                                        Kes
                                    </Button>
                                    <Button icon={<CopyOutlined />} onClick={() => handleBulkCopy('copy')}>
                                        Kopyala
                                    </Button>
                                    {selectedFiles.length === 1 && isArchive(selectedFiles[0].name) ? (
                                        <Button.Group>
                                            <Button
                                                icon={<FolderOpenOutlined />}
                                                onClick={() => handleExtract(currentPath, selectedFiles[0])}
                                            >
                                                Buraya Aç
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setSelectedContextItem(selectedFiles[0]);
                                                    setExtractPathModalVisible(true);
                                                }}
                                            >
                                                Farklı Konuma Aç...
                                            </Button>
                                        </Button.Group>
                                    ) : (
                                        <Button
                                            icon={<CompressOutlined />}
                                            onClick={() => setCompressModalVisible(true)}
                                        >
                                            Sıkıştır
                                        </Button>
                                    )}
                                    <Button
                                        icon={<DeleteOutlined />}
                                        danger
                                        onClick={handleBulkDelete}
                                    >
                                        Sil
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Sıkıştırma Format Modalı */}
            <Modal
                title="Sıkıştırma Formatı"
                open={compressModalVisible}
                onCancel={() => setCompressModalVisible(false)}
                footer={null}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio.Group value={compressFormat} onChange={e => setCompressFormat(e.target.value)}>
                        <Radio.Button value="zip">ZIP</Radio.Button>
                        <Radio.Button value="targz">TAR.GZ</Radio.Button>
                        <Radio.Button value="tarbz2">TAR.BZ2</Radio.Button>
                    </Radio.Group>
                    <Button
                        type="primary"
                        block
                        onClick={() => handleCompress(compressFormat)}
                        loading={loading}
                    >
                        Sıkıştır
                    </Button>
                </Space>
            </Modal>

            <Modal
                title="Dosya Çakışması"
                open={conflictModalVisible}
                onCancel={() => setConflictModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setConflictModalVisible(false)}>
                        İptal
                    </Button>,
                    <Button
                        key="keepBoth"
                        onClick={() => {
                            setExtractOptions({ overwriteExisting: false, keepBoth: true });
                            handleExtract();
                        }}
                    >
                        İkisini de Sakla
                    </Button>,
                    <Button
                        key="overwrite"
                        type="primary"
                        danger
                        onClick={() => {
                            setExtractOptions({ overwriteExisting: true, keepBoth: false });
                            handleExtract();
                        }}
                    >
                        Üzerine Yaz
                    </Button>
                ]}
            >
                <Alert
                    message="Aşağıdaki dosyalar hedef konumda zaten mevcut:"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <List
                    dataSource={conflicts}
                    renderItem={item => (
                        <List.Item>
                            <Typography.Text>
                                <FileOutlined style={{ marginRight: 8 }} />
                                {item}
                            </Typography.Text>
                        </List.Item>
                    )}
                    style={{
                        maxHeight: '300px',
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        padding: '8px'
                    }}
                />
                <div style={{ marginTop: 16 }}>
                    <Typography.Text type="secondary">
                        • "İkisini de Sakla" seçeneği, çakışan dosyaları (1), (2) gibi son ekler ile kaydeder
                        <br />
                        • "Üzerine Yaz" seçeneği, mevcut dosyaların üzerine yazılmasına neden olur
                    </Typography.Text>
                </div>
            </Modal>
        </div>
    );
}

// CSS'i güncelleyelim
const styles = `
.hidden-file {
    opacity: 0.6;
}

.paste-card {
    transition: all 0.3s ease;
}

.paste-card.pulse {
    animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
    0% {
        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(24, 144, 255, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
    }
}

/* Kesilen ve kopyalanan dosyalar için stiller */
.file-item {
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid transparent;
    transition: all 0.3s ease;
}

.cut-item {
    border-color: #ff4d4f;
    color: rgba(0, 0, 0, 0.45);
}

[data-theme='dark'] .cut-item {
    color: rgba(255, 255, 255, 0.45);
}

.copied-item {
    border-color: #1677ff;
}

/* Çoklu seçim stilleri */
.selected-item {
    background-color: rgba(24, 144, 255, 0.1);
    border-color: #1677ff;
}

[data-theme='dark'] .selected-item {
    background-color: rgba(24, 144, 255, 0.2);
}

/* Yüzen menü stilleri */
.floating-menu {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--component-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 1000;
    min-width: 600px;
    max-width: 800px;
}

.selected-files-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.files-count {
    font-weight: bold;
    color: var(--text-color);
}

.files-details {
    max-height: 200px;
    overflow-y: auto;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    padding: 8px 0;
}

.file-detail {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    color: var(--text-secondary);
}

.action-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
}

.action-buttons .ant-btn {
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

/* Tablo içeriğinin seçilmesini engelle */
.file-item {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

/* Tüm tablo içeriği için seçim engelleme */
.ant-table-cell {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

/* Sadece kopyalanabilir alanlar için seçime izin ver */
.selectable {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
}

.menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 8px;
}

.left-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Yüzen yapıştır butonu animasyonu */
.floating-paste-button {
    animation: breathe 2s infinite ease-in-out;
}

.floating-paste-button .ant-float-btn-body {
    background-color: var(--primary-color) !important;
}

.floating-paste-button .ant-float-btn-icon {
    color: white !important;
}

@keyframes breathe {
    0% {
        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
        transform: scale(1);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(24, 144, 255, 0);
        transform: scale(1.1);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
        transform: scale(1);
    }
}

/* Dark mode için farklı glow rengi */
[data-theme='dark'] .floating-paste-button {
    animation: breathe-dark 2s infinite ease-in-out;
}

@keyframes breathe-dark {
    0% {
        box-shadow: 0 0 0 0 rgba(45, 183, 245, 0.4);
        transform: scale(1);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(45, 183, 245, 0);
        transform: scale(1.1);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(45, 183, 245, 0);
        transform: scale(1);
    }
}
`;

// Style tag'ini head'e ekle
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default FilesPage; 