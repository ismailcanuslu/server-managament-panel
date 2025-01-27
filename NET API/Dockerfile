# .NET 9.0 SDK imajını kullanarak build işlemi yapıyoruz
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

# DNS ayarlarını yapılandır
COPY resolv.conf /etc/resolv.conf

# Ağ ayarlarını yapılandır
RUN apt-get update && apt-get install -y iputils-ping dnsutils curl

# DNS ve ağ bağlantısını test et
RUN ping -c 2 1.1.1.1 || true
RUN nslookup api.nuget.org || true
RUN curl -I https://api.nuget.org/v3/index.json || true

# Çalışma dizinini belirliyoruz
WORKDIR /app

# NuGet yapılandırması
ENV DOTNET_SYSTEM_NET_HTTP_USESOCKETSHTTPHANDLER=0
ENV NUGET_XMLDOC_MODE=skip
ENV DOTNET_RUNNING_IN_CONTAINER=true

# HTTP_PROXY ayarları (eğer proxy kullanıyorsanız)
# ENV http_proxy=http://proxy.example.com:port
# ENV https_proxy=http://proxy.example.com:port

# NuGet kaynaklarını yapılandır
RUN dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org

# Projeyi restore etmek için gerekli dosyaları kopyalıyoruz
COPY *.csproj .
RUN dotnet restore --disable-parallel --force

# Tüm kaynak kodlarını kopyalıyoruz ve projeyi derliyoruz
COPY . .
RUN dotnet build --configuration Release --output /app/build

# Uygulama çalıştırmak için runtime imajını kullanıyoruz
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime

# Çalışma dizinini belirliyoruz
WORKDIR /app

# Derlenen dosyaları runtime imajına kopyalıyoruz
COPY --from=build /app/build .

# Üretim ortamı için çevresel değişkenleri ayarlıyoruz
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5244

# Uygulamanın başlatılacak dosyasını belirliyoruz
ENTRYPOINT ["dotnet", "web-panel-app.dll"]

# Uygulamanın dinleyeceği portu açıyoruz
EXPOSE 5244
