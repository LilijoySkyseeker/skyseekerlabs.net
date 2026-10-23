{
  description = "skyseekerlabs.net: a static site built with Zola";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
      rev = self.shortRev or self.dirtyShortRev or "dirty";
      date = self.lastModifiedDate or "19700101000000";
    in
    {
      packages = forAll (pkgs: {
        default = pkgs.stdenvNoCC.mkDerivation {
          pname = "skyseekerlabs-site";
          version = rev;
          src = self;
          nativeBuildInputs = [ pkgs.zola ];
          # zola's load_data builds an HTTP client at startup and panics without CA certs,
          # even though every file it loads here is local
          SSL_CERT_FILE = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";
          buildPhase = ''
            zola build --output-dir $out
            # build stamp in the footer: which commit, and when
            find $out -name '*.html' -exec sed -i \
              -e 's/__BUILD_REV__/${rev}/g' -e 's/__BUILD_DATE__/${date}/g' {} +
          '';
          dontInstall = true;
        };
      });

      devShells = forAll (pkgs: {
        default = pkgs.mkShellNoCC { packages = [ pkgs.zola ]; };
      });

      formatter = forAll (pkgs: pkgs.nixfmt-rfc-style);
    };
}
