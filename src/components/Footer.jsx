export default function Footer() {
  return (
    <footer>
      <div className="div-footer">
        <div className="footer-link-container">
          <a href="mailto:amusto@gmail.com">Contact Me</a>
          <a href="https://github.com/ammusto/tarassum" target="_blank" rel="noopener noreferrer">
            <img id="git_footer" src="/github-mark.png" alt="GitHub" />
          </a>
          &copy; Antonio Musto {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
