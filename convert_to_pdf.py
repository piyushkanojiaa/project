"""
Convert EVALUATOR_REPORT.md to PDF
Uses markdown2 and weasyprint for conversion
"""

import os
import sys

def convert_markdown_to_pdf():
    """Convert the evaluator report from Markdown to PDF"""
    
    try:
        # Try importing required libraries
        try:
            import markdown2
            from weasyprint import HTML, CSS
            print("✓ Libraries loaded successfully")
        except ImportError as e:
            print(f"Installing required libraries...")
            os.system('pip install markdown2 weasyprint')
            import markdown2
            from weasyprint import HTML, CSS
            print("✓ Libraries installed and loaded")
        
        # Read the markdown file
        md_file = 'EVALUATOR_REPORT.md'
        print(f"\nReading {md_file}...")
        
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        print(f"✓ Read {len(md_content)} characters")
        
        # Convert markdown to HTML
        print("\nConverting Markdown to HTML...")
        html_content = markdown2.markdown(md_content, extras=[
            'tables',
            'fenced-code-blocks',
            'header-ids',
            'code-friendly'
        ])
        
        # Create styled HTML
        styled_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: A4;
            margin: 2cm;
        }}
        body {{
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }}
        h1 {{
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-top: 30px;
        }}
        h2 {{
            color: #1e40af;
            border-bottom: 2px solid #ddd;
            padding-bottom: 8px;
            margin-top: 25px;
        }}
        h3 {{
            color: #1e3a8a;
            margin-top: 20px;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background-color: #2563eb;
            color: white;
            font-weight: bold;
        }}
        tr:nth-child(even) {{
            background-color: #f8f9fa;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        pre {{
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #2563eb;
        }}
        pre code {{
            background-color: transparent;
            padding: 0;
        }}
        blockquote {{
            border-left: 4px solid #2563eb;
            padding-left: 20px;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }}
        .emoji {{
            font-size: 1.2em;
        }}
        hr {{
            border: none;
            border-top: 2px solid #ddd;
            margin: 30px 0;
        }}
        ul, ol {{
            margin: 10px 0;
            padding-left: 30px;
        }}
        li {{
            margin: 5px 0;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>
"""
        
        print("✓ HTML generated with styling")
        
        # Convert HTML to PDF
        print("\nGenerating PDF...")
        pdf_file = 'EVALUATOR_REPORT.pdf'
        
        HTML(string=styled_html).write_pdf(
            pdf_file,
            stylesheets=[CSS(string='@page { size: A4; margin: 2cm; }')]
        )
        
        # Get file size
        file_size = os.path.getsize(pdf_file) / 1024  # KB
        
        print(f"\n{'='*50}")
        print(f"✓ PDF GENERATED SUCCESSFULLY!")
        print(f"{'='*50}")
        print(f"\nFile: {pdf_file}")
        print(f"Size: {file_size:.1f} KB")
        print(f"Location: {os.path.abspath(pdf_file)}")
        print(f"\n{'='*50}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        print(f"\nTrying alternative method...")
        return False

if __name__ == "__main__":
    success = convert_markdown_to_pdf()
    if not success:
        print("\nAlternative: Use online converter or print to PDF from browser")
        print("1. Open EVALUATOR_REPORT.md in VS Code")
        print("2. Install 'Markdown PDF' extension")
        print("3. Right-click > Markdown PDF: Export (pdf)")
    sys.exit(0 if success else 1)
